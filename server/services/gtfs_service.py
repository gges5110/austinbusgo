""" This file contains methods to retrieve data from database """
from typing import List

from models.gtfs_models import Routes, Trips, Stops, Shapes, StopTimes


class GTFSService:
    def __init__(self):
        pass

    # Stops
    @staticmethod
    def get_stop(stop_id: int) -> Stops:
        return Stops.get_by_id(stop_id)

    # Trips
    @staticmethod
    def get_trips_with_distinct_headsign(trip_ids: List[str], route_name_prefix: str = None) -> List[Trips]:
        if route_name_prefix is None:
            return Trips \
                .select(Trips, Routes) \
                .distinct(Trips.trip_headsign) \
                .join(Routes, on=(Trips.route_id == Routes.route_id).alias("routes")) \
                .where(Trips.trip_id.in_(trip_ids))
        else:
            return Trips \
                .select(Trips, Routes) \
                .distinct(Trips.trip_headsign) \
                .join(Routes, on=(Trips.route_id == Routes.route_id).alias("routes")) \
                .where(Trips.trip_id.in_(trip_ids) & Trips.trip_headsign.startswith(route_name_prefix))

    @staticmethod
    def get_trips_with_direction_and_route(trip_ids: List[str], route_id: int, direction: bool) -> List[Trips]:
        return [trip.trip_id for trip in Trips.select(Trips.trip_id)
                .where((Trips.trip_id.in_(trip_ids))
                       & (Trips.route_id == route_id)
                       & (Trips.direction_id == direction))]

    @staticmethod
    def get_trip_by_id(trip_id: str) -> Trips:
        return Trips.get(Trips.trip_id == trip_id)

    # Shapes
    @staticmethod
    def get_shapes_by_trip_id(trip_id: str) -> List[Shapes]:
        trip = Trips.get_by_id(trip_id)
        return Shapes.select().where(Shapes.shape_id == trip.shape_id)

    # StopTimes
    @staticmethod
    def get_stop_time(trip_id: str, stop_id: str) -> StopTimes:
        return StopTimes.get((StopTimes.trip_id == trip_id) & (StopTimes.stop_id == stop_id))

    @staticmethod
    def get_stops_by_trip_id(trip_id: List[str]) -> List[Stops]:
        return Stops.select(Stops, StopTimes, Trips) \
            .join(StopTimes, on=(Stops.stop_id == StopTimes.stop_id).alias('stoptime')) \
            .join(Trips, on=(StopTimes.trip_id == Trips.trip_id).alias('trip')) \
            .where(StopTimes.trip_id == trip_id)
