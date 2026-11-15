import asyncio
import logging
import time
from dataclasses import asdict, dataclass
from typing import Dict, List, Optional, Sequence, Tuple

import httpx
from google.transit import gtfs_realtime_pb2
from google.transit.gtfs_realtime_pb2 import TripUpdate, VehiclePosition, FeedEntity

""" Responsible for requesting GTFS real time data. """

logger = logging.getLogger(__name__)

# Clients poll arrivals every 15s; one upstream fetch per feed per worker per
# CACHE_TTL_SECONDS is shared by every request in that window.
CACHE_TTL_SECONDS = 10

# data.texas.gov usually answers in under a second but at times takes 5-80s.
# A download gets this long, and runs on its own: requests wait for it only
# briefly, so riders never wait on a slow upstream for long.
FETCH_TIMEOUT_SECONDS = 20
# With a copy at most STALE_OK_SECONDS old, a request waits this long for a
# newer one, then answers with the copy
STALE_OK_SECONDS = 120
WAIT_WITH_COPY_SECONDS = 1
# With no usable copy (a fresh worker), a request waits this long before
# falling back to scheduled times; the download carries on for the next one
WAIT_WITHOUT_COPY_SECONDS = 4

# url -> (fetched_at monotonic seconds, feed entities)
_feed_cache: Dict[str, Tuple[float, Sequence[FeedEntity]]] = {}


@dataclass
class FeedStats:
    """How fetching one feed has gone since this worker started (/status)"""

    successes: int = 0
    failures: int = 0
    last_success_at: Optional[float] = None  # epoch seconds
    last_failure_at: Optional[float] = None
    last_error: Optional[str] = None
    last_fetch_ms: Optional[int] = None
    # The feed's own header timestamp: how fresh CapMetro's data is
    feed_timestamp: Optional[int] = None
    entities: Optional[int] = None
    # The last request got an older copy: the newer one failed or was slow
    serving_stale: bool = False


# url -> stats
_feed_stats: Dict[str, FeedStats] = {}

# url -> the fetch in progress, shared so concurrent requests don't each
# hit a slow upstream
_inflight: Dict[str, "asyncio.Future[Sequence[FeedEntity]]"] = {}


def feed_stats(url: str) -> dict:
    return asdict(_feed_stats.get(url, FeedStats()))


class RealtimeFeedError(Exception):
    """The upstream GTFS-RT feed could not be fetched or parsed."""


def clear_feed_cache() -> None:
    _feed_cache.clear()
    _feed_stats.clear()
    _inflight.clear()


class GTFSRTClient:
    def __init__(
        self, trip_updates_pb_file_url: str, vehicle_positions_pb_file_url: str
    ):
        self.trip_updates_pb_file_url = trip_updates_pb_file_url
        self.vehicle_positions_pb_file_url = vehicle_positions_pb_file_url

    async def load_trip_updates(self) -> List[TripUpdate]:
        feed_entities = await GTFSRTClient._get_feed_message_entity_from_url(
            self.trip_updates_pb_file_url
        )
        return [entity.trip_update for entity in feed_entities]

    async def load_vehicle_positions(
        self, route_id: str = None
    ) -> List[VehiclePosition]:
        feed_entities = await GTFSRTClient._get_feed_message_entity_from_url(
            self.vehicle_positions_pb_file_url
        )
        return GTFSRTClient._get_valid_vehicles(feed_entities, route_id)

    @staticmethod
    async def _get_feed_message_entity_from_url(url: str) -> Sequence[FeedEntity]:
        cached = _feed_cache.get(url)
        age = time.monotonic() - cached[0] if cached is not None else None
        if cached is not None and age < CACHE_TTL_SECONDS:
            return cached[1]
        usable = cached is not None and age < STALE_OK_SECONDS

        download = _inflight.get(url)
        # A download from another event loop (a restarted app, in tests)
        # can't be awaited here
        if (
            download is not None
            and download.get_loop() is not asyncio.get_running_loop()
        ):
            download = None
        if download is None:
            download = asyncio.ensure_future(GTFSRTClient._fetch(url))
            _inflight[url] = download
            download.add_done_callback(lambda done: GTFSRTClient._settle(url, done))
        stats = _feed_stats.setdefault(url, FeedStats())
        try:
            # Shielded: giving up on the wait leaves the download running
            entities = await asyncio.wait_for(
                asyncio.shield(download),
                WAIT_WITH_COPY_SECONDS if usable else WAIT_WITHOUT_COPY_SECONDS,
            )
        except (asyncio.TimeoutError, RealtimeFeedError) as error:
            if usable:
                stats.serving_stale = True
                return cached[1]
            if isinstance(error, RealtimeFeedError):
                raise
            raise RealtimeFeedError(
                f"still downloading after {WAIT_WITHOUT_COPY_SECONDS}s"
            ) from error
        stats.serving_stale = False
        return entities

    @staticmethod
    def _settle(url: str, done: "asyncio.Future") -> None:
        if _inflight.get(url) is done:
            del _inflight[url]
        # Retrieve a failure nobody waited for, so asyncio doesn't warn
        if not done.cancelled():
            done.exception()

    @staticmethod
    async def _fetch(url: str) -> Sequence[FeedEntity]:
        """Downloads, parses and caches a feed, recording how it went"""
        stats = _feed_stats.setdefault(url, FeedStats())
        started = time.monotonic()
        try:
            async with httpx.AsyncClient(
                follow_redirects=True, timeout=FETCH_TIMEOUT_SECONDS
            ) as client:
                response = await client.get(url)
                response.raise_for_status()
            feed_message = gtfs_realtime_pb2.FeedMessage()
            feed_message.ParseFromString(response.content)
        except Exception as error:
            # Timeouts have no message of their own
            reason = f"{type(error).__name__}: {error}".rstrip(": ")[:200]
            logger.warning("GTFS-RT fetch failed for %s: %s", url, reason)
            stats.failures += 1
            stats.last_failure_at = time.time()
            stats.last_error = reason
            stats.last_fetch_ms = round((time.monotonic() - started) * 1000)
            raise RealtimeFeedError(reason) from error
        stats.successes += 1
        stats.last_success_at = time.time()
        stats.last_fetch_ms = round((time.monotonic() - started) * 1000)
        stats.feed_timestamp = feed_message.header.timestamp or None
        stats.entities = len(feed_message.entity)
        _feed_cache[url] = (time.monotonic(), feed_message.entity)
        return feed_message.entity

    @staticmethod
    def _get_valid_vehicles(
        feed_entities: Sequence[FeedEntity], route_id: str
    ) -> List[VehiclePosition]:
        if route_id is None:
            return [
                feed_entity.vehicle
                for feed_entity in feed_entities
                if feed_entity.vehicle.HasField("trip")
            ]
        else:
            return [
                feed_entity.vehicle
                for feed_entity in feed_entities
                if feed_entity.vehicle.HasField("trip")
                and feed_entity.vehicle.trip.route_id == str(route_id)
            ]


async def warm_realtime_feeds() -> None:
    """Fetch both CapMetro feeds once, ignoring failures (worker startup)"""
    from server.config import (
        capital_metro_trip_updates_pb_file_url,
        capital_metro_vehicle_positions_pb_file_url,
    )

    await asyncio.gather(
        *(
            GTFSRTClient._get_feed_message_entity_from_url(url)
            for url in (
                capital_metro_trip_updates_pb_file_url,
                capital_metro_vehicle_positions_pb_file_url,
            )
        ),
        return_exceptions=True,
    )
