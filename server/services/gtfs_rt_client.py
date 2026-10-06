import logging
import time
from typing import Dict, List, Sequence, Tuple

import httpx
from google.transit import gtfs_realtime_pb2
from google.transit.gtfs_realtime_pb2 import TripUpdate, VehiclePosition, FeedEntity

""" Responsible for requesting GTFS real time data. """

logger = logging.getLogger(__name__)

# Clients poll arrivals every 15s; one upstream fetch per feed per worker per
# CACHE_TTL_SECONDS is shared by every request in that window.
CACHE_TTL_SECONDS = 10
FETCH_TIMEOUT_SECONDS = 3

# url -> (fetched_at monotonic seconds, feed entities)
_feed_cache: Dict[str, Tuple[float, Sequence[FeedEntity]]] = {}


class RealtimeFeedError(Exception):
    """The upstream GTFS-RT feed could not be fetched or parsed."""


def clear_feed_cache() -> None:
    _feed_cache.clear()


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
        if cached is not None and time.monotonic() - cached[0] < CACHE_TTL_SECONDS:
            return cached[1]
        try:
            async with httpx.AsyncClient(
                follow_redirects=True, timeout=FETCH_TIMEOUT_SECONDS
            ) as client:
                response = await client.get(url)
                response.raise_for_status()
            feed_message = gtfs_realtime_pb2.FeedMessage()
            feed_message.ParseFromString(response.content)
        except Exception as error:
            logger.warning("GTFS-RT fetch failed for %s: %s", url, error)
            raise RealtimeFeedError(str(error)) from error
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
