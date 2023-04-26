from typing import List

from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate

from server.config import capital_metro_trip_updates_pb_file_url, capital_metro_vehicle_positions_pb_file_url
from server.services.gtfs_rt_client import GTFSRTClient
from server.services.gtfs_service import GTFSService


class GTFSRTService:
    """
    A class that handles retrieving information about real time GTFS data, including vehicle positions and trip updates.
    """

    def __init__(self, gtfs_rt_client: GTFSRTClient = None):
        self.gtfs_rt_client = gtfs_rt_client or GTFSRTClient(capital_metro_trip_updates_pb_file_url,
                                                             capital_metro_vehicle_positions_pb_file_url)

    def get_real_time_vehicle_trip_ids(self, route_id: str = None) -> List[str]:
        """
        Returns all running trip ids of a given route
        :param route_id: string
        :return: running trip ids of a given route
        """
        return [self.get_trip_id(vehicle_position) for vehicle_position in
                self.gtfs_rt_client.load_vehicle_positions(route_id=route_id)]

    def get_real_time_vehicle_positions(self, route_id: str, direction: bool) -> List[VehiclePosition]:
        current_vehicle_positions = self.gtfs_rt_client.load_vehicle_positions(route_id=route_id)
        trip_ids = [self.get_trip_id(vehicle_position)
                    for vehicle_position in current_vehicle_positions]

        trips_on_route = GTFSService.get_trips_with_direction_and_route(
            trip_ids, int(route_id), direction)
        return [vehicle_position for vehicle_position in current_vehicle_positions if
                self.get_trip_id(vehicle_position)
                in trips_on_route]

    def get_real_time_vehicle_position(self, trip_id: str) -> VehiclePosition:
        current_vehicle_positions = self.gtfs_rt_client.load_vehicle_position(trip_id)

    @staticmethod
    def get_trip_id(vehicle: VehiclePosition) -> str:
        """
        A helper method for accessing trip id of a vehicle position
        :param vehicle: VehiclePosition
        :return: trip id
        """
        return vehicle.trip.trip_id

    def get_real_time_trip_updates(self, trip_ids: List[str] = None) -> List[TripUpdate]:
        """
        Retrieves trip updates, optionally filter by list of trip ids.
        :param trip_ids:
        :return: real time trip updates
        """
        trip_updates = self.gtfs_rt_client.load_trip_updates()

        if trip_ids is None:
            return trip_updates
        else:
            return [trip_update_list for trip_update_list in trip_updates if trip_update_list.trip.trip_id in trip_ids]

    @staticmethod
    def get_arrival_time_by_stop_id(stop_time_updates: List[TripUpdate.StopTimeUpdate], stop_id: str) \
            -> TripUpdate.StopTimeUpdate or None:
        """
        Iterates over a list of stop time updates, returns the first element that matches the stop id
        :param stop_time_updates: the list to inspect.
        :param stop_id: the stop id to search from.
        :return: returns the matched stop time update, else return None.
        """
        try:
            return next(stop_time_update for stop_time_update in stop_time_updates
                        if stop_time_update.stop_id == str(stop_id))
        except StopIteration:
            return None
