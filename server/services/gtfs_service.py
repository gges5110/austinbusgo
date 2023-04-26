""" This file contains methods to retrieve data from database """
from datetime import datetime, timedelta
from typing import List

from server.models.gtfs_models import Routes, Trips, Stops, Shapes, StopTimes, CalendarDates


class GTFSService:
    def __init__(self):
        pass

    # Routes
    @staticmethod
    def get_route(route_id: str) -> Routes:
        return Routes.get_by_id(route_id)

    # Stops
    @staticmethod
    def get_stop(stop_id: int) -> Stops:
        return Stops.get_by_id(stop_id)

    @staticmethod
    def get_stops_by_route_id(route_id: str, direction_id: bool, date: str) -> List[Stops]:
        return Stops.select(Stops, Trips, StopTimes) \
            .distinct(Stops.stop_id) \
            .join(StopTimes, on=(Stops.stop_id == StopTimes.stop_id).alias('stoptime')) \
            .join(Trips, on=(StopTimes.trip_id == Trips.trip_id).alias('trip')) \
            .join(CalendarDates, on=(CalendarDates.service_id == Trips.service_id)) \
            .where((Trips.route_id == route_id)
                   & (Trips.direction_id == direction_id)
                   & (CalendarDates.date == date)
                   )

    # Trips
    @staticmethod
    def get_distinct_trip_headsigns(trip_ids: List[str]) -> List[Trips]:
        return Trips \
            .select(Trips.trip_headsign, Trips.trip_id) \
            .distinct(Trips.trip_headsign) \
            .where(Trips.trip_id.in_(trip_ids))

    @staticmethod
    def get_all_trips() -> List[Trips]:
        return Trips \
            .select(Trips, Routes) \
            .distinct(Trips.trip_headsign) \
            .join(Routes, on=(Trips.route_id == Routes.route_id).alias("routes"))

    @staticmethod
    def get_trips_for_date(date: str) -> List[Trips]:
        return Trips \
            .select(Trips, Routes) \
            .distinct(Trips.trip_headsign) \
            .join(Routes, on=(Trips.route_id == Routes.route_id).alias("routes")) \
            .join(CalendarDates, on=(CalendarDates.service_id == Trips.service_id)) \
            .where(CalendarDates.date == date)

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

    @staticmethod
    def get_shapes_by_shape_id(shape_id: str) -> List[Shapes]:
        return Shapes.select().where(Shapes.shape_id == shape_id)

    # StopTimes
    @staticmethod
    def get_stop_time(trip_id: str, stop_id: str) -> StopTimes:
        return StopTimes.get((StopTimes.trip_id == trip_id) & (StopTimes.stop_id == stop_id))

    @staticmethod
    def get_stop_time_by_route_id(route_id: str, direction: bool, stop_id: str, date: str) -> List[StopTimes]:
        return StopTimes.select(StopTimes, Stops, Trips) \
            .join(Trips, on=(StopTimes.trip_id == Trips.trip_id).alias('trip')) \
            .join(Stops, on=(Stops.stop_id == StopTimes.stop_id)) \
            .join(CalendarDates, on=(CalendarDates.service_id == Trips.service_id)) \
            .where((Trips.route_id == route_id)
                   & (Trips.direction_id == direction)
                   & (StopTimes.stop_id == stop_id)
                   & (CalendarDates.date == date)
                   & (StopTimes.arrival_time > (datetime.now() + timedelta(hours=-1)).strftime("%H:%M:%S"))
                   )
