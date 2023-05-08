""" This file contains methods to retrieve data from database """
from datetime import datetime, timedelta
from typing import List

from playhouse.postgres_ext import Match

from server.models.gtfs_models import Routes, Trips, Stops, Shapes, StopTimes, CalendarDates


class GTFSService:
    def __init__(self):
        pass

    # Routes
    @staticmethod
    def get_route(route_id: str) -> Routes:
        return Routes.get_by_id(route_id)

    @staticmethod
    def get_routes() -> List[Routes]:
        return Routes.select(Routes)

    @staticmethod
    def get_routes_by_name(term: str) -> List[Routes]:
        return Routes.select(Routes).where(
            Match(Routes.route_id, term) |
            Match(Routes.route_long_name, term) |
            Match(Routes.route_short_name, term)
        )

    # Stops
    @staticmethod
    def get_stop(stop_id: int) -> Stops:
        return Stops.get_by_id(stop_id)

    @staticmethod
    def get_stops_by_name(stop_name: str) -> List[Stops]:
        return Stops.select(Stops).where(
            Match(Stops.at_street, stop_name) |
            Match(Stops.on_street, stop_name) |
            Match(Stops.stop_name, stop_name) |
            Match(Stops.stop_code, stop_name)
        )

    @staticmethod
    def get_near_by_stops(lat: float, lon: float, distance: float = 1.0):
        return Stops.select(Stops).where((lat + distance >= Stops.stop_lat) & (Stops.stop_lat >= lat - distance) &
                                         (lon + distance >= Stops.stop_lon) & (Stops.stop_lon >= lon - distance))

    @staticmethod
    def get_stops_by_route_id(route_id: str, direction_id: int, date: str) -> List[Stops]:
        # using subquery here to allow "distinct on" and "order by" different columns.
        # https://stackoverflow.com/a/9796104/4816922
        subquery = Stops.select(Stops.stop_id) \
            .join(StopTimes, on=(Stops.stop_id == StopTimes.stop_id)) \
            .join(Trips, on=(StopTimes.trip_id == Trips.trip_id)) \
            .join(CalendarDates, on=(CalendarDates.service_id == Trips.service_id)) \
            .where((Trips.route_id == route_id)
                   & (Trips.direction_id == direction_id)
                   & (CalendarDates.date == date)
                   ) \
            .order_by(StopTimes.stop_sequence).alias("subquery")
        return Stops.select(Stops, StopTimes, Trips) \
            .distinct(Stops.stop_id) \
            .join(StopTimes, on=(Stops.stop_id == StopTimes.stop_id).alias('stoptime')) \
            .join(Trips, on=(StopTimes.trip_id == Trips.trip_id).alias('trip')) \
            .join(CalendarDates, on=(CalendarDates.service_id == Trips.service_id)) \
            .where((Trips.route_id == route_id)
                   & (Trips.direction_id == direction_id)
                   & (CalendarDates.date == date)
                   & Stops.stop_id.in_(subquery)
                   )

    # Trips
    @staticmethod
    def get_trips_by_distinct_short_name(route_id: str, date: str) -> List[Trips]:
        return Trips \
            .select(Trips) \
            .join(CalendarDates, on=(CalendarDates.service_id == Trips.service_id)) \
            .distinct(Trips.direction_id, Trips.trip_short_name) \
            .where((Trips.route_id == route_id) & (CalendarDates.date == date)) \
            .order_by(Trips.direction_id, Trips.trip_short_name)

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
    def get_trips_with_direction_and_route(trip_ids: List[str], route_id: str, direction: int) -> List[Trips]:
        return [trip.trip_id for trip in Trips.select(Trips.trip_id)
        .where((Trips.trip_id.in_(trip_ids))
               & (Trips.route_id == route_id)
               & (Trips.direction_id == direction))]

    @staticmethod
    def get_trip_by_id(trip_id: str) -> Trips:
        trips = list(Trips.select(Trips, Routes)
                     .join(Routes, on=(Routes.route_id == Trips.route_id).alias("route"))
                     .where(Trips.trip_id == trip_id))
        return trips[0]

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
    def get_stop_times_by_trip_id(trip_id: str) -> List[StopTimes]:
        return StopTimes.select(StopTimes, Stops) \
            .join(Stops, on=(Stops.stop_id == StopTimes.stop_id).alias('stop')) \
            .where((StopTimes.trip_id == trip_id))

    @staticmethod
    def get_stop_time_by_route_id(stop_id: str, date: str) -> List[StopTimes]:
        return StopTimes.select(StopTimes, Stops, Trips, Routes) \
            .join(Trips, on=(StopTimes.trip_id == Trips.trip_id).alias('trip')) \
            .join(Routes, on=(Routes.route_id == Trips.route_id).alias("route")) \
            .join(Stops, on=(Stops.stop_id == StopTimes.stop_id)) \
            .join(CalendarDates, on=(CalendarDates.service_id == Trips.service_id)) \
            .where((StopTimes.stop_id == stop_id)
                   & (CalendarDates.date == date)
                   & (StopTimes.arrival_time > (datetime.now() + timedelta(minutes=-10)).strftime("%H:%M:%S"))
                   )
