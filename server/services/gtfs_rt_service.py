from typing import List

from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate

from server.config import (
    capital_metro_trip_updates_pb_file_url,
    capital_metro_vehicle_positions_pb_file_url,
)
from server.services.gtfs_rt_client import GTFSRTClient
from server.services.gtfs_service import GTFSService


class GTFSRTService:
    """
    A class that handles retrieving information about real time GTFS data, including vehicle positions and trip updates.
    """

    def __init__(self, gtfs_rt_client: GTFSRTClient = None):
        self.gtfs_rt_client = gtfs_rt_client or GTFSRTClient(
            capital_metro_trip_updates_pb_file_url,
            capital_metro_vehicle_positions_pb_file_url,
        )

    def get_real_time_vehicle_positions_on_route(
        self, route_id: str, direction: int
    ) -> List[VehiclePosition]:
        current_vehicle_positions = self.gtfs_rt_client.load_vehicle_positions(
            route_id=route_id
        )
        trip_ids = [
            self.get_trip_id(vehicle_position)
            for vehicle_position in current_vehicle_positions
        ]

        trips_on_route = GTFSService.get_trips_with_direction_and_route(
            trip_ids, route_id, direction
        )
        return [
            vehicle_position
            for vehicle_position in current_vehicle_positions
            if self.get_trip_id(vehicle_position) in trips_on_route
        ]

    def get_real_time_vehicle_positions(self) -> List[VehiclePosition]:
        return self.gtfs_rt_client.load_vehicle_positions()

    @staticmethod
    def get_trip_id(vehicle: VehiclePosition) -> str:
        return vehicle.trip.trip_id

    def get_all_real_time_trip_updates(
        self, route_id: str = None, trip_id: str = None
    ) -> List[TripUpdate]:
        trip_updates = self.gtfs_rt_client.load_trip_updates()
        if trip_id:
            return [
                trip_update_list
                for trip_update_list in trip_updates
                if trip_update_list.trip.trip_id == trip_id
            ]
        elif route_id:
            return [
                trip_update_list
                for trip_update_list in trip_updates
                if trip_update_list.trip.route_id == route_id
            ]
        else:
            return trip_updates

    def get_real_time_trip_updates(self, trip_ids: List[str]) -> List[TripUpdate]:
        trip_updates = self.gtfs_rt_client.load_trip_updates()
        return [
            trip_update_list
            for trip_update_list in trip_updates
            if trip_update_list.trip.trip_id in trip_ids
        ]

    @staticmethod
    def get_arrival_time_by_stop_id(
        stop_time_updates: List[TripUpdate.StopTimeUpdate], stop_id: str
    ) -> TripUpdate.StopTimeUpdate or None:
        try:
            return next(
                stop_time_update
                for stop_time_update in stop_time_updates
                if stop_time_update.stop_id == str(stop_id)
            )
        except StopIteration:
            return None
