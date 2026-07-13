"""Merge scheduled stop times with real-time trip updates.

Logic moved unchanged from the former GraphQL resolvers
(server/gql/resolvers/base.py and arrivals.py).
"""

from datetime import datetime
from time import time
from types import SimpleNamespace
from typing import List, Optional

from google.transit.gtfs_realtime_pb2 import TripUpdate
from pytz import timezone

from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_service import GTFSService


class ArrivalService:
    def __init__(self, gtfs_service: GTFSService, gtfs_rt_service: GTFSRTService):
        self.gtfs_service = gtfs_service
        self.gtfs_rt_service = gtfs_rt_service

    def _get_updated_arrival_time(
        self, stop_id: str, stop_time_updates: List[TripUpdate.StopTimeUpdate]
    ):
        """Get updated arrival time for a stop from real-time data."""
        stop_time_update = self.gtfs_rt_service.get_arrival_time_by_stop_id(
            stop_time_updates, stop_id
        )
        if stop_time_update is None:
            return None
        if stop_time_update.schedule_relationship == 1:
            return None
        arrival_time_update = (
            stop_time_update.arrival.time
            if stop_time_update.HasField("arrival")
            else stop_time_update.departure.time
        )
        return (
            datetime.fromtimestamp(arrival_time_update)
            .astimezone(timezone("US/Central"))
            .strftime("%H:%M:%S")
        )

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

    async def get_arrival_times(self, stop_id: str, date: str) -> List[SimpleNamespace]:
        stop_times = await self.gtfs_service.get_stop_times_by_stop_id(stop_id, date)
        trip_ids = [st.trip.trip_id for st in stop_times]
        trip_updates = self.gtfs_rt_service.get_real_time_trip_updates(trip_ids)
        trip_updates_by_trip_id = {
            tu.trip.trip_id: self._get_updated_arrival_time(
                stop_id, tu.stop_time_update
            )
            for tu in trip_updates
        }
        return [
            SimpleNamespace(
                scheduled_arrival_time=st.arrival_time,
                updated_arrival_time=trip_updates_by_trip_id.get(st.trip.trip_id, None),
                trip=st.trip,
            )
            for st in stop_times
        ]

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
