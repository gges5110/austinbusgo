from datetime import datetime
from typing import List, Dict

from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate
from pytz import timezone

from server.config import capital_metro_trip_updates_pb_file_url, capital_metro_vehicle_positions_pb_file_url
from server.models.gtfs_models import Stops, Trips, Shapes, Routes
from server.services.gtfs_rt_client import GTFSRTClient
from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_service import GTFSService


class ArrivalTimeInfo:
    scheduled_arrival_time: str
    updated_arrival_time: str
    trip: Trips
    vehicle: VehiclePosition


class Resolver:
    def __init__(self, gtfs_service: GTFSService = None):
        self.gtfs_client = GTFSRTClient(capital_metro_trip_updates_pb_file_url,
                                        capital_metro_vehicle_positions_pb_file_url)
        self.gtfs_service = gtfs_service or GTFSService()
        self.gtfs_rt_service = GTFSRTService(self.gtfs_client)

    def resolve_trip(self, query, info, trip_id) -> Trips:
        return self.gtfs_service.get_trip_by_id(trip_id)

    def resolve_trips(self, query, info, date: str):
        # TODO only get trips that has upcoming arrival times.
        trips_with_distinct_headsign = self.gtfs_service.get_trips_for_date(date)
        unique_trip_headsigns = [trip.trip_headsign for trip in trips_with_distinct_headsign]

        trip_info_list = [{
            'trip_id': trip.trip_id,
            'route_id': trip.route_id,
            'direction': trip.direction_id,
            'route_long_name': trip.routes.route_long_name,
            'color': trip.routes.route_color,
            'trip_headsign': trip.trip_headsign,
            'running': trip.trip_headsign in unique_trip_headsigns,
            'dir_abbr': trip.dir_abbr,
        } for trip in self.gtfs_service.get_all_trips()]

        # Alphabetically sort trips by trip_headsign
        trip_info_list.sort(key=lambda trip_info: (-trip_info['running'], trip_info['trip_headsign']))
        return trip_info_list

    def resolve_stops_and_shapes(self, query, info, route_id: str, direction_id: bool, date: str):
        stops = self.gtfs_service.get_stops_by_route_id(route_id, direction_id, date)
        stops_and_shapes = {'stops': [stop for stop in stops], 'shapes': []}
        shape_id_set = set([stop.stoptime.trip.shape_id for stop in stops])
        for shape_id in shape_id_set:
            stops_and_shapes['shapes'].append(self.gtfs_service.get_shapes_by_shape_id(shape_id))
        return stops_and_shapes

    def resolve_stop(self, query, info, stop_id) -> Stops:
        return self.gtfs_service.get_stop(stop_id)

    def resolve_route(self, query, info, route_id) -> Routes:
        return self.gtfs_service.get_route(route_id)

    def resolve_route_shapes(self, query, info, trip_id) -> List[Shapes]:
        return self.gtfs_service.get_shapes_by_trip_id(trip_id)

    def resolve_vehicle_positions(self, query, info, route_id: int, direction: bool) -> List[VehiclePosition]:
        return self.gtfs_rt_service.get_real_time_vehicle_positions(str(route_id), direction)

    def resolve_arrival_times(self, query, info, route_id: int, direction: bool, stop_id: str, date: str):
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
        # get trip ids from gtfs
        stop_times = self.gtfs_service.get_stop_time_by_route_id(route_id, direction, stop_id, date)
        vehicles: List[VehiclePosition] = self.gtfs_rt_service.get_real_time_vehicle_positions(
            str(route_id), direction)
        vehicle_by_trip_id: Dict[str, VehiclePosition] = {
            self.gtfs_rt_service.get_trip_id(v): v for v in vehicles
        }
        trip_ids = [stop_time.trip.trip_id for stop_time in stop_times]
        trip_updates = self.gtfs_rt_service.get_real_time_trip_updates(trip_ids)
        updates = {
            trip_update.trip.trip_id: self._populate_updated_arrival_time(stop_id, trip_update.stop_time_update) for
            trip_update in trip_updates
        }

        arrival_times = [{
            'vehicle': vehicle_by_trip_id.get(stop_time.trip.trip_id, None),
            'scheduled_arrival_time': stop_time.arrival_time,
            'updated_arrival_time': updates.get(stop_time.trip.trip_id, None),
            'trip': stop_time.trip,
        } for stop_time in stop_times]
        # Sort the arrival times by timestamp
        arrival_times.sort(key=lambda x: x['scheduled_arrival_time'], reverse=False)
        return arrival_times

    def _populate_updated_arrival_time(self, stop_id: str, stop_time_updates: List[TripUpdate.StopTimeUpdate]):
        stop_time_update = self.gtfs_rt_service.get_arrival_time_by_stop_id(stop_time_updates, stop_id)

        if stop_time_update is None:
            return None

        arrival_time_update = stop_time_update.arrival.time if stop_time_update.HasField('arrival') \
            else stop_time_update.departure.time

        updated_arrival_time = datetime.fromtimestamp(arrival_time_update).astimezone(
            timezone('US/Central')).strftime('%H:%M:%S')

        return updated_arrival_time

    # def _remove_past_vehicles(self, vehicle_by_trip_id: Dict[str, VehiclePosition], stop_id: str) -> None:
    #     past_vehicle_trip_ids: List[str] = []
    #     for (trip_id, vehicle_position) in vehicle_by_trip_id.items():
    #         try:
    #             stop_time = self.gtfs_service.get_stop_time(trip_id, stop_id)
    #         except StopTimes.DoesNotExist:
    #             continue
    #         current_stop_sequence = vehicle_by_trip_id[trip_id].current_stop_sequence
    #         if stop_time.stop_sequence < current_stop_sequence:
    #             past_vehicle_trip_ids.append(trip_id)
    #
    #     for trip_id in past_vehicle_trip_ids:
    #         del vehicle_by_trip_id[trip_id]

    # def _populate_scheduled_arrival_time(self, arrival_time_by_trip_id: Dict[str, ArrivalTimeInfo], stop_id, trip_id) \
    #         -> None:
    #     if trip_id not in arrival_time_by_trip_id:
    #         arrival_time_by_trip_id[trip_id] = ArrivalTimeInfo()
    #     arrival_time = arrival_time_by_trip_id[trip_id]
    #     try:
    #         stop_time = self.gtfs_service.get_stop_time(trip_id, stop_id)
    #     except StopTimes.DoesNotExist:
    #         arrival_time.scheduled_arrival_time = None
    #         return
    #
    #     arrival_time.scheduled_arrival_time = stop_time.arrival_time

    # For debugging purposes
    def resolve_vehicle_positions_debug(self, query, info) -> List[VehiclePosition]:
        return self.gtfs_client.load_vehicle_positions()
