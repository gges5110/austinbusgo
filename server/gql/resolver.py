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

    def resolve_trip(self, query, info, trip_id: str) -> Trips:
        return self.gtfs_service.get_trip_by_id(trip_id)

    def resolve_distinct_trips(self, query, info, route_id: str, date: str) -> List[Trips]:
        return self.gtfs_service.get_trips_by_distinct_short_name(route_id, date)

    def resolve_stops_and_shapes(self, query, info, route_id: str, direction_id: int, date: str):
        stops = self.gtfs_service.get_stops_by_route_id(route_id, direction_id, date)
        stops_and_shapes = {'stops': [stop for stop in stops], 'shapes': []}
        shape_id_set = set([stop.stoptime.trip.shape_id for stop in stops])
        for shape_id in shape_id_set:
            stops_and_shapes['shapes'].append(self.gtfs_service.get_shapes_by_shape_id(shape_id))
        return stops_and_shapes

    def resolve_stop(self, query, info, stop_id) -> Stops:
        return self.gtfs_service.get_stop(stop_id)

    def resolve_near_by_stops(self, query, info, lat: float, lon: float, distance: float = 0.01):
        return self.gtfs_service.get_near_by_stops(lat, lon, distance) or []

    def resolve_stops_by_name(self, query, info, stop_name):
        return self.gtfs_service.get_stops_by_name(stop_name) or []

    def resolve_route(self, query, info, route_id) -> Routes:
        return self.gtfs_service.get_route(route_id)

    def resolve_routes(self, query, info) -> List[Routes]:
        return self.gtfs_service.get_routes()

    def resolve_route_shapes(self, query, info, trip_id) -> List[Shapes]:
        return self.gtfs_service.get_shapes_by_trip_id(trip_id)

    def resolve_vehicle_positions(self, query, info, route_id: str, direction: int) -> List[VehiclePosition]:
        return self.gtfs_rt_service.get_real_time_vehicle_positions_on_route(route_id, direction)

    def resolve_stop_times(self, query, info, trip_id: str):
        return self.gtfs_service.get_stop_times_by_trip_id(trip_id)

    def resolve_search(self, query, info, search_term: str):
        search_term = search_term.replace(" ", "&")
        return {
            'stops': self.gtfs_service.get_stops_by_name(search_term),
            'routes': self.gtfs_service.get_routes_by_name(search_term),
        }

    def resolve_arrival_times(self, query, info, stop_id: str, date: str):
        # get trip ids from gtfs
        stop_times = self.gtfs_service.get_stop_time_by_route_id(stop_id, date)
        vehicles = self.gtfs_rt_service.get_real_time_vehicle_positions()
        vehicle_by_trip_id = {
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

    # For debugging purposes
    def resolve_vehicle_positions_debug(self, query, info) -> List[VehiclePosition]:
        return self.gtfs_client.load_vehicle_positions()
