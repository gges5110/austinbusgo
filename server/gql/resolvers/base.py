"""Base resolver with common initialization and helper methods."""

from datetime import datetime
from typing import List, Optional

from google.transit.gtfs_realtime_pb2 import TripUpdate
from pytz import timezone
from sqlalchemy.ext.asyncio import AsyncSession

from server.config import (
    capital_metro_trip_updates_pb_file_url,
    capital_metro_vehicle_positions_pb_file_url,
)
from server.services.gtfs_rt_client import GTFSRTClient
from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_service import GTFSService


class BaseResolver:
    """Base resolver with shared services."""

    def __init__(self, session: AsyncSession, gtfs_service: GTFSService = None):
        self.session = session
        self.gtfs_rt_client = GTFSRTClient(
            capital_metro_trip_updates_pb_file_url,
            capital_metro_vehicle_positions_pb_file_url,
        )
        self.gtfs_service = gtfs_service or GTFSService(session)
        self.gtfs_rt_service = GTFSRTService(self.gtfs_service, self.gtfs_rt_client)

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

    def _get_earliest_updated_arrival_time(
        self,
        stop_id: str,
        stop_time_updates_list: List[List[TripUpdate.StopTimeUpdate]],
    ):
        """Get earliest updated arrival time from multiple stop time updates."""
        earliest = None
        for stop_time_updates in stop_time_updates_list:
            t = self._get_updated_arrival_time(stop_id, stop_time_updates)
            if t:
                if earliest is None or t < earliest:
                    earliest = t
        return earliest
