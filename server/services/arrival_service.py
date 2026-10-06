"""Merge scheduled stop times with real-time trip updates.

Logic moved unchanged from the former GraphQL resolvers
(server/gql/resolvers/base.py and arrivals.py).
"""

from datetime import datetime, timedelta
from time import time
from types import SimpleNamespace
from typing import List, Optional

from google.transit.gtfs_realtime_pb2 import TripUpdate
from pytz import timezone

from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_service import GTFSService
from server.services.upcoming import (
    SCHEDULE_LOOKBACK_SECONDS,
    WINDOW_AHEAD_SECONDS,
    build_arrival,
    build_track,
    format_gtfs_time,
    local_today,
    seconds_into_service_day,
    select_arrivals,
    to_epoch,
)


class ArrivalService:
    def __init__(self, gtfs_service: GTFSService, gtfs_rt_service: GTFSRTService):
        self.gtfs_service = gtfs_service
        self.gtfs_rt_service = gtfs_rt_service

    def _get_raw_arrival_timestamp(
        self, stop_id: str, stop_time_updates: List[TripUpdate.StopTimeUpdate]
    ) -> Optional[float]:
        """Return the raw Unix timestamp for a stop's RT arrival, or None."""
        stop_time_update = self.gtfs_rt_service.get_arrival_time_by_stop_id(
            stop_time_updates, stop_id
        )
        if stop_time_update is None or stop_time_update.schedule_relationship == 1:
            return None
        return (
            stop_time_update.arrival.time
            if stop_time_update.HasField("arrival")
            else stop_time_update.departure.time
        )

    def _get_earliest_updated_arrival_time(
        self,
        stop_id: str,
        stop_time_updates_list: List[List[TripUpdate.StopTimeUpdate]],
    ):
        """Get earliest future updated arrival time from multiple stop time updates.

        Compares by Unix timestamp to correctly handle times that cross midnight.
        """
        now_ts = time()
        earliest_ts = None
        earliest_str = None
        for stop_time_updates in stop_time_updates_list:
            ts = self._get_raw_arrival_timestamp(stop_id, stop_time_updates)
            if ts is None or ts < now_ts:
                continue
            if earliest_ts is None or ts < earliest_ts:
                earliest_ts = ts
                earliest_str = (
                    datetime.fromtimestamp(ts)
                    .astimezone(timezone("US/Central"))
                    .strftime("%H:%M:%S")
                )
        return earliest_str

    async def get_earliest_arrival_times_on_route(
        self, route_id: str, direction_id: int, date: str, time: str
    ) -> List[SimpleNamespace]:
        earliest = await self.gtfs_service.get_earliest_arrival_times_on_route(
            route_id, direction_id, date, time
        )
        trip_updates = await self.gtfs_rt_service.get_real_time_trip_updates_on_route(
            route_id, direction_id
        )
        stop_time_updates_list = [tu.stop_time_update for tu in trip_updates]
        return [
            SimpleNamespace(
                stop_id=r.stop_id,
                stop_sequence=r.stop_sequence,
                scheduled_arrival_time=r.arrival_time,
                trip_id=r.trip_id,
                updated_arrival_time=self._get_earliest_updated_arrival_time(
                    r.stop_id, stop_time_updates_list
                ),
            )
            for r in earliest
        ]

    async def get_upcoming(self, stop_id: str, now: Optional[int] = None) -> dict:
        """Buses due at a stop in the next hour, merged with live data.

        Raises NoResultFound for an unknown stop.
        """
        now = int(time()) if now is None else now
        stop = await self.gtfs_service.get_stop(stop_id)
        stop.routes = await self.gtfs_service.get_routes_at_stop(stop_id)
        snapshot = await self.gtfs_rt_service.get_snapshot()

        today = local_today(now)
        candidates = []
        # Yesterday's service day still runs after midnight ("25:10:00")
        for service_date in (today - timedelta(days=1), today):
            offset = seconds_into_service_day(service_date, now)
            rows = await self.gtfs_service.get_stop_times_at_stop_in_window(
                stop_id,
                service_date,
                format_gtfs_time(offset - SCHEDULE_LOOKBACK_SECONDS),
                format_gtfs_time(offset + WINDOW_AHEAD_SECONDS),
            )
            for row in rows:
                arrival = build_arrival(row, service_date, stop_id, snapshot, now)
                if arrival is not None:
                    candidates.append(arrival)

        arrivals = select_arrivals(candidates)
        for arrival in arrivals:
            vehicle_seq = arrival["vehicle_stop_sequence"]
            if vehicle_seq is None:
                continue
            trip_stop_times = await self.gtfs_service.get_stop_times_by_trip_id(
                arrival["trip_id"]
            )
            target_seq = arrival["stop_sequence"]
            arrival["stops_away"] = sum(
                1
                for st in trip_stop_times
                if vehicle_seq <= st.stop_sequence < target_seq
            )
            arrival["track"] = build_track(
                trip_stop_times,
                arrival["service_date"],
                vehicle_seq,
                target_seq,
                snapshot.trip_updates.get(arrival["trip_id"]),
            )

        return {
            "stop": stop,
            "generated_at": now,
            "realtime_available": snapshot.available,
            "arrivals": arrivals,
            "next_scheduled": (
                None if arrivals else await self._next_scheduled(stop_id, today, now)
            ),
        }

    async def _next_scheduled(self, stop_id: str, today, now: int) -> Optional[dict]:
        """First scheduled bus after the window, today or tomorrow."""
        searches = [
            (
                today,
                format_gtfs_time(
                    seconds_into_service_day(today, now) + WINDOW_AHEAD_SECONDS
                ),
            ),
            (today + timedelta(days=1), "00:00:00"),
        ]
        for service_date, start_time in searches:
            rows = await self.gtfs_service.get_stop_times_at_stop_in_window(
                stop_id, service_date, start_time, "99:59:59", limit=1
            )
            if rows:
                row = rows[0]
                scheduled_at = to_epoch(service_date, row.arrival_time)
                return {
                    "trip_id": row.trip_id,
                    "route_id": row.route_id,
                    "route_color": row.route_color,
                    "headsign": row.trip_headsign,
                    "direction_id": row.direction_id,
                    "scheduled_at": scheduled_at,
                    "predicted_at": None,
                    "stops_away": None,
                    "status": "scheduled",
                    "vehicle": None,
                    "track": [],
                }
        return None
