import logging
from datetime import datetime
from typing import List, Dict, Any

from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate
from pytz import timezone

from server.config import capital_metro_trip_updates_pb_file_url, capital_metro_vehicle_positions_pb_file_url
from server.models.gtfs_models import Stops, Trips, Shapes
from server.services.gtfs_service import GTFSService
from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_rt_client import GTFSClient

logger = logging.getLogger('resolver')


class ArrivalTimeInfo:
    scheduled_arrival_time: str
    updated_arrival_time: str
    trip: Trips
    vehicle: VehiclePosition


class Resolver:
    def __init__(self, gtfs_service: GTFSService = None):
        self.gtfs_client = GTFSClient(capital_metro_trip_updates_pb_file_url,
                                      capital_metro_vehicle_positions_pb_file_url)
        self.gtfs_service = gtfs_service or GTFSService()
        self.gtfs_rt_service = GTFSRTService(self.gtfs_client)

    def resolve_running_trips(self, query, info, filter_input=None):
        if filter_input is None:
            filter_input = {}
        route_name_prefix = filter_input['name_prefix'] if 'name_prefix' in filter_input else None

        trip_ids = self.gtfs_rt_service.get_real_time_vehicle_trip_ids()

        trips_with_distinct_headsign = self.gtfs_service.get_trips_with_distinct_headsign(
            trip_ids, route_name_prefix)

        trip_info_list = [{
            'trip_id': trip.trip_id,
            'route_id': trip.route_id,
            'direction': trip.direction_id,
            'name': trip.trip_headsign,
            'color': trip.routes.route_color
        } for trip in trips_with_distinct_headsign]

        # Alphabetically sort trips by route_id
        trip_info_list.sort(key=lambda trip_info: (trip_info['name']))
        return trip_info_list

    def resolve_trip(self, query, info, trip_id) -> Trips:
        return self.gtfs_service.get_trip_by_id(trip_id)

    def resolve_stops(self, query, info, trip_id) -> List[Stops]:
        return self.gtfs_service.get_stops_by_trip_id(trip_id)

    def resolve_stop(self, query, info, stop_id) -> Stops:
        return self.gtfs_service.get_stop(stop_id)

    def resolve_route_shapes(self, query, info, trip_id) -> List[Shapes]:
        return self.gtfs_service.get_shapes_by_trip_id(trip_id)

    def resolve_vehicle_positions(self, query, info, route_id: int, direction: bool) -> List[VehiclePosition]:
        return self.gtfs_rt_service.get_real_time_vehicle_positions(str(route_id), direction)

    def resolve_arrival_times(self, query, info, route_id: int, direction: bool, stop_id: str):
        """Finds the arrival times of a route at a given stop.

        Args:
          route_id: The route_id to find arrival times for.
          stop_id: The bus stop.

        Returns:
          A json object with fields
            'arrival_times': An array of arrival info, each item is an object:
              'vehicle_info': Vehicle information.
              'arrival_time': The time the vehicle arrives at the given stop
              :param route_id:
              :param stop_id:
              :param direction:
        """

        # TODO: load arrival time for scheduled trips (non-running trips)

        vehicles: List[VehiclePosition] = self.gtfs_rt_service.get_real_time_vehicle_positions(
            str(route_id), direction)
        vehicle_by_trip_id: Dict[str, VehiclePosition] = {
            self.gtfs_rt_service.get_trip_id(v): v for v in vehicles
        }

        self._remove_past_vehicles(vehicle_by_trip_id, stop_id)

        arrival_time_info_by_trip_id: Dict[str, ArrivalTimeInfo] = {}

        trip_ids = list(set(vehicle_by_trip_id.keys()))
        for trip_id in trip_ids:
            self._populate_scheduled_arrival_time(arrival_time_info_by_trip_id, stop_id, trip_id)

        trip_updates = self.gtfs_rt_service.get_real_time_trip_updates(trip_ids)
        for trip_update in trip_updates:
            arrival_time = arrival_time_info_by_trip_id[trip_update.trip.trip_id]
            self._populate_updated_arrival_time(arrival_time, stop_id, trip_update.stop_time_update)

        arrival_times = [{
            'vehicle': vehicle_position,
            'scheduled_arrival_time': arrival_time_info_by_trip_id[trip_id].scheduled_arrival_time,
            'updated_arrival_time': arrival_time_info_by_trip_id[trip_id].updated_arrival_time,
            'trip': self.gtfs_service.get_trip_by_id(trip_id),
        } for (trip_id, vehicle_position) in vehicle_by_trip_id.items()]

        # Sort the arrival times by timestamp
        arrival_times.sort(key=lambda x: x['scheduled_arrival_time'], reverse=False)
        return arrival_times

    def _remove_past_vehicles(self, vehicle_by_trip_id: Dict[str, VehiclePosition], stop_id: str) -> None:
        past_vehicle_trip_ids: List[str] = []
        for (trip_id, vehicle_position) in vehicle_by_trip_id.items():
            stop_time = self.gtfs_service.get_stop_time(trip_id, stop_id)
            current_stop_sequence = vehicle_by_trip_id[trip_id].current_stop_sequence
            if stop_time.stop_sequence < current_stop_sequence:
                past_vehicle_trip_ids.append(trip_id)

        for trip_id in past_vehicle_trip_ids:
            del vehicle_by_trip_id[trip_id]

    def _populate_updated_arrival_time(self, arrival_time: ArrivalTimeInfo, stop_id: str,
                                       stop_time_updates: List[TripUpdate.StopTimeUpdate]) -> None:
        stop_time_update = self.gtfs_rt_service.get_arrival_time_by_stop_id(stop_time_updates, stop_id)

        if stop_time_update is None:
            arrival_time.updated_arrival_time = None
            return

        arrival_time_update = stop_time_update.arrival.time if stop_time_update.HasField('arrival') \
            else stop_time_update.departure.time

        updated_arrival_time = datetime.fromtimestamp(arrival_time_update).astimezone(
            timezone('US/Central')).strftime('%H:%M:%S')

        arrival_time.updated_arrival_time = updated_arrival_time

    def _populate_scheduled_arrival_time(self, arrival_time_by_trip_id: Dict[str, ArrivalTimeInfo], stop_id, trip_id) \
            -> None:
        stop_time = self.gtfs_service.get_stop_time(trip_id, stop_id)

        if trip_id not in arrival_time_by_trip_id:
            arrival_time_by_trip_id[trip_id] = ArrivalTimeInfo()

        arrival_time = arrival_time_by_trip_id[trip_id]
        arrival_time.scheduled_arrival_time = stop_time.arrival_time

    # For debugging purposes
    def resolve_vehicle_positions_debug(self, query, info) -> List[VehiclePosition]:
        return self.gtfs_client.load_vehicle_positions()
