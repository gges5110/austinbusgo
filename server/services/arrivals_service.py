"""Service for handling arrival time calculations and updates."""

from datetime import datetime
from typing import List, Optional, Dict
from pytz import timezone
from google.transit.gtfs_realtime_pb2 import TripUpdate

from services.gtfs_service import GTFSService
from services.gtfs_rt_service import GTFSRTService
from utils.logging import get_logger

logger = get_logger(__name__)


class ArrivalsService:
    """Service for managing arrival time queries and real-time updates."""

    def __init__(self, gtfs_service: GTFSService, gtfs_rt_service: GTFSRTService):
        """
        Initialize ArrivalsService.

        Args:
            gtfs_service: GTFS static data service
            gtfs_rt_service: GTFS real-time data service
        """
        self.gtfs_service = gtfs_service
        self.gtfs_rt_service = gtfs_rt_service
        self.timezone = timezone("US/Central")

    def get_arrival_times_for_stop(
        self, stop_id: str, date: str
    ) -> List[Dict]:
        """
        Get arrival times for a specific stop with real-time updates.

        Args:
            stop_id: Stop identifier
            date: Date string

        Returns:
            List of arrival time dictionaries with scheduled and updated times
        """
        # Get scheduled stop times from GTFS
        stop_times = self.gtfs_service.get_stop_times_by_stop_id(stop_id, date)
        trip_ids = [stop_time.trip.trip_id for stop_time in stop_times]

        # Get real-time trip updates
        trip_updates = self.gtfs_rt_service.get_real_time_trip_updates(trip_ids)
        trip_updates_by_trip_id = {
            trip_update.trip.trip_id: self._get_updated_arrival_time(
                stop_id, trip_update.stop_time_update
            )
            for trip_update in trip_updates
        }

        # Combine scheduled and real-time data
        arrival_times = [
            {
                "scheduled_arrival_time": stop_time.arrival_time,
                "updated_arrival_time": trip_updates_by_trip_id.get(
                    stop_time.trip.trip_id, None
                ),
                "trip": stop_time.trip,
            }
            for stop_time in stop_times
        ]

        return arrival_times

    def get_earliest_arrival_times_on_route(
        self, route_id: str, direction_id: int, date: str, time: str
    ) -> List[Dict]:
        """
        Get earliest arrival times for each stop on a route with real-time updates.

        Args:
            route_id: Route identifier
            direction_id: Direction (0 or 1)
            date: Date string
            time: Time string

        Returns:
            List of arrival time dictionaries for each stop
        """
        # Get scheduled earliest arrival times
        earliest_arrival_times_on_route = (
            self.gtfs_service.get_earliest_arrival_times_on_route(
                route_id, direction_id, date, time
            )
        )

        # Get real-time trip updates
        trip_updates = self.gtfs_rt_service.get_real_time_trip_updates_on_route(
            route_id, direction_id
        )

        stop_time_updates_list = [
            trip_update.stop_time_update for trip_update in trip_updates
        ]

        # Combine scheduled and real-time data
        arrival_times = [
            {
                "scheduled_arrival_time": r.arrival_time,
                "stop_id": r.stop_id,
                "stop_sequence": r.stop_sequence,
                "trip_id": r.trip_id,
                "updated_arrival_time": self._get_earliest_updated_arrival_time(
                    r.stop_id, stop_time_updates_list
                ),
            }
            for r in earliest_arrival_times_on_route
        ]

        return arrival_times

    def _get_updated_arrival_time(
        self, stop_id: str, stop_time_updates: List[TripUpdate.StopTimeUpdate]
    ) -> Optional[str]:
        """
        Get updated arrival time for a specific stop from real-time data.

        Args:
            stop_id: Stop identifier
            stop_time_updates: List of stop time updates from real-time feed

        Returns:
            Updated arrival time string (HH:MM:SS) or None
        """
        stop_time_update = self.gtfs_rt_service.get_arrival_time_by_stop_id(
            stop_time_updates, stop_id
        )

        if stop_time_update is None:
            return None

        # schedule_relationship == 1 means SKIPPED
        if stop_time_update.schedule_relationship == 1:
            return None

        # Get arrival or departure time
        arrival_time_update = (
            stop_time_update.arrival.time
            if stop_time_update.HasField("arrival")
            else stop_time_update.departure.time
        )

        # Convert timestamp to formatted time string
        updated_arrival_time = (
            datetime.fromtimestamp(arrival_time_update)
            .astimezone(self.timezone)
            .strftime("%H:%M:%S")
        )

        return updated_arrival_time

    def _get_earliest_updated_arrival_time(
        self,
        stop_id: str,
        stop_time_updates_list: List[List[TripUpdate.StopTimeUpdate]],
    ) -> Optional[str]:
        """
        Get earliest updated arrival time from multiple trip updates.

        Args:
            stop_id: Stop identifier
            stop_time_updates_list: List of stop time update lists from multiple trips

        Returns:
            Earliest updated arrival time string or None
        """
        earliest = None

        for stop_time_updates in stop_time_updates_list:
            t = self._get_updated_arrival_time(stop_id, stop_time_updates)
            if t:
                if earliest is None or t < earliest:
                    earliest = t

        return earliest
