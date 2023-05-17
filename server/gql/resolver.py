from datetime import datetime
from typing import List

from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate
from pytz import timezone
from shapely import LineString

from server.config import (
    capital_metro_trip_updates_pb_file_url,
    capital_metro_vehicle_positions_pb_file_url,
)
from server.models.gtfs_models import Stops, Trips, Routes
from server.services.gtfs_rt_client import GTFSRTClient
from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_service import GTFSService


class Resolver:
    def __init__(self, gtfs_service: GTFSService = None):
        self.gtfs_rt_client = GTFSRTClient(
            capital_metro_trip_updates_pb_file_url,
            capital_metro_vehicle_positions_pb_file_url,
        )
        self.gtfs_service = gtfs_service or GTFSService()
        self.gtfs_rt_service = GTFSRTService(self.gtfs_rt_client)

    # Trips
    def resolve_trip(self, query, info, trip_id: str) -> Trips:
        return self.gtfs_service.get_trip_by_id(trip_id)

    def resolve_distinct_trips(
        self, query, info, route_id: str, date: str
    ) -> List[Trips]:
        return self.gtfs_service.get_trips_by_distinct_short_name(route_id, date)

    def resolve_trip_ids_for_route(self, query, info, route_id: str, date: str):
        return {
            "tripIds": [
                trip.trip_id
                for trip in self.gtfs_service.get_trips_for_date(route_id, date)
            ]
        }

    # Stops
    def resolve_stops_and_shapes(
        self, query, info, route_id: str, direction_id: int, date: str
    ):
        stops = self.gtfs_service.get_stops_by_route_id(route_id, direction_id)
        stops_and_shapes = {
            "stops": sorted(
                [stop for stop in stops], key=lambda stop: stop.stop_time.stop_sequence
            ),
            "shapes": [],
        }

        shape_id_set = set([stop.stop_time.trip.shape_id for stop in stops])
        for shape_id in shape_id_set:
            stops_and_shapes["shapes"].append(
                self.gtfs_service.get_shapes_by_shape_id(shape_id).shape
            )
        return stops_and_shapes

    def resolve_stop(self, query, info, stop_id: str) -> Stops:
        return self.gtfs_service.get_stop(stop_id)

    def resolve_near_by_stops(
        self, query, info, lat: float, lon: float, distance: float = 0.01
    ) -> List[Stops]:
        return self.gtfs_service.get_near_by_stops(lat, lon, distance) or []

    def resolve_stops_by_name(self, query, info, stop_name) -> List[Stops]:
        return self.gtfs_service.get_stops_by_name(stop_name) or []

    # Routes
    def resolve_route(self, query, info, route_id) -> Routes:
        return self.gtfs_service.get_route(route_id)

    def resolve_routes(self, query, info) -> List[Routes]:
        return self.gtfs_service.get_routes()

    def resolve_route_shapes(self, query, info, trip_id) -> LineString:
        return self.gtfs_service.get_shapes_by_trip_id(trip_id).shape

    def resolve_vehicle_positions(
        self, query, info, route_id: str, direction: int
    ) -> List[VehiclePosition]:
        return self.gtfs_rt_service.get_real_time_vehicle_positions_on_route(
            route_id, direction
        )

    def resolve_stop_times(self, query, info, trip_id: str):
        return self.gtfs_service.get_stop_times_by_trip_id(trip_id)

    def resolve_search(self, query, info, search_term: str):
        search_terms = search_term.split(" ")
        return {
            "stops": self.gtfs_service.get_stops_by_name(search_terms),
            "routes": self.gtfs_service.get_routes_by_name(search_terms),
        }

    def resolve_earliest_arrival_times_on_route(
        self, query, info, route_id: str, direction_id: int, date: str, time: str
    ):
        earliest_arrival_times_on_route = (
            self.gtfs_service.get_earliest_arrival_times_on_route(
                route_id, direction_id, date, time
            )
        )

        trip_updates = self.gtfs_rt_service.get_real_time_trip_updates_on_route(
            route_id, direction_id
        )

        stop_time_update_by_trip = {
            trip_update.trip.trip_id: trip_update.stop_time_update
            for trip_update in trip_updates
        }

        arrival_times = [
            {
                "scheduled_arrival_time": r.arrival_time,
                "stop_id": r.stop_id,
                "stop_sequence": r.stop_sequence,
                "trip_id": r.trip_id,
                "updated_arrival_time": self._populate_updated_arrival_time(
                    r.stop_id, stop_time_update_by_trip.get(r.trip_id, [])
                ),
            }
            for r in earliest_arrival_times_on_route
        ]

        return arrival_times

    def resolve_arrival_times(self, query, info, stop_id: str, date: str):
        # get trip ids from gtfs
        stop_times = self.gtfs_service.get_stop_times_by_stop_id(stop_id, date)
        trip_ids = [stop_time.trip.trip_id for stop_time in stop_times]
        trip_updates = self.gtfs_rt_service.get_real_time_trip_updates(trip_ids)
        trip_updates_by_trip_id = {
            trip_update.trip.trip_id: self._populate_updated_arrival_time(
                stop_id, trip_update.stop_time_update
            )
            for trip_update in trip_updates
        }

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

    def _populate_updated_arrival_time(
        self, stop_id: str, stop_time_updates: List[TripUpdate.StopTimeUpdate]
    ):
        stop_time_update = self.gtfs_rt_service.get_arrival_time_by_stop_id(
            stop_time_updates, stop_id
        )

        if stop_time_update is None:
            return None

        arrival_time_update = (
            stop_time_update.arrival.time
            if stop_time_update.HasField("arrival")
            else stop_time_update.departure.time
        )

        updated_arrival_time = (
            datetime.fromtimestamp(arrival_time_update)
            .astimezone(timezone("US/Central"))
            .strftime("%H:%M:%S")
        )

        return updated_arrival_time

    # For debugging purposes
    def resolve_vehicle_positions_debug(self, query, info) -> List[VehiclePosition]:
        return self.gtfs_rt_service.get_real_time_vehicle_positions()

    def resolve_trip_update(self, query, info, trip_id: str) -> TripUpdate:
        trip_updates = self.gtfs_rt_service.get_all_real_time_trip_updates(
            trip_id=trip_id
        )

        return trip_updates[0] if len(trip_updates) > 0 else None

    def resolve_trip_updates(self, query, info, filter) -> List[TripUpdate]:
        return self.gtfs_rt_service.get_all_real_time_trip_updates(
            filter.route_id, filter.trip_id
        )
