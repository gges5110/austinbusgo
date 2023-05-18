""" This file contains methods to retrieve data from database """
from datetime import datetime, timedelta
from typing import List

import peewee
from playhouse.postgres_ext import Match

from server.models.gtfs_models import (
    Routes,
    Trips,
    Stops,
    StopTimes,
    CalendarDates,
    AggregatedShape,
    RoutesAtStop,
)


class GTFSService:
    def __init__(self):
        pass

    # Routes
    @staticmethod
    def get_route(route_id: str) -> Routes:
        return Routes.get_by_id(route_id)

    @staticmethod
    def get_routes() -> List[Routes]:
        return Routes.select()

    @staticmethod
    def get_routes_by_name(search_terms: List[str]) -> List[Routes]:
        if len(search_terms) == 1:
            term = search_terms[0]
            return Routes.select().where(
                Match(Routes.route_id, term) | Match(Routes.route_long_name, term)
            )
        else:
            term = "|".join(search_terms)
            return Routes.select().where(
                Match(Routes.route_id, term) & Match(Routes.route_long_name, term)
            )

    @staticmethod
    def get_routes_at_stop(stop_id: str) -> List[Routes]:
        return Routes.select(Routes).join(
            RoutesAtStop,
            on=(
                (RoutesAtStop.route_id == Routes.route_id)
                & (RoutesAtStop.stop_id == stop_id)
            ),
        )

    # Stops
    @staticmethod
    def get_stop(stop_id: str) -> Stops:
        return Stops.get_by_id(stop_id)

    @staticmethod
    def get_stops_by_name(search_terms: List[str]) -> List[Stops]:
        if len(search_terms) == 1:
            term = search_terms[0]
            return Stops.select().where(
                Match(Stops.at_street, term)
                | Match(Stops.on_street, term)
                | Match(Stops.stop_name, term)
                | Match(Stops.stop_code, term)
            )
        else:
            term = "|".join(search_terms)
            return Stops.select().where(
                Match(Stops.stop_name, term) & Match(Stops.stop_code, term)
            )

    @staticmethod
    def get_near_by_stops(lat: float, lon: float, distance: float = 1.0) -> List[Stops]:
        return (
            Stops.select()
            .order_by(
                peewee.fn.ST_Distance(
                    Stops.stop_loc,
                    peewee.fn.ST_SetSRID(peewee.fn.ST_MakePoint(lon, lat), 4326),
                )
            )
            .limit(100)
        )

    @staticmethod
    def get_stops_by_route_id(route_id: str, direction_id: int) -> List[Stops]:
        return (
            Stops.select(Stops, StopTimes, Trips)
            .distinct(Stops.stop_id)
            .join(StopTimes, on=(Stops.stop_id == StopTimes.stop_id).alias("stop_time"))
            .join(Trips, on=(StopTimes.trip_id == Trips.trip_id).alias("trip"))
            .where((Trips.route_id == route_id) & (Trips.direction_id == direction_id))
        )

    # Trips
    @staticmethod
    def get_trips_by_distinct_short_name(route_id: str, date: str) -> List[Trips]:
        return (
            Trips.select(Trips)
            .join(CalendarDates, on=(CalendarDates.service_id == Trips.service_id))
            .distinct(Trips.direction_id, Trips.trip_headsign)
            .where((Trips.route_id == route_id) & (CalendarDates.date == date))
            .order_by(Trips.direction_id, Trips.trip_headsign)
        )

    @staticmethod
    def get_all_trips() -> List[Trips]:
        return (
            Trips.select(Trips, Routes)
            .distinct(Trips.trip_headsign)
            .join(Routes, on=(Trips.route_id == Routes.route_id).alias("routes"))
        )

    @staticmethod
    def get_trips_for_date(route_id: str, date: str) -> List[Trips]:
        return (
            Trips.select(Trips, Routes)
            .join(Routes, on=(Trips.route_id == Routes.route_id).alias("routes"))
            .join(CalendarDates, on=(CalendarDates.service_id == Trips.service_id))
            .where((CalendarDates.date == date) & (Routes.route_id == route_id))
        )

    @staticmethod
    def get_trips_with_direction_and_route(
        trip_ids: List[str], route_id: str, direction: int
    ) -> List[Trips]:
        return [
            trip.trip_id
            for trip in Trips.select(Trips.trip_id).where(
                (Trips.trip_id.in_(trip_ids))
                & (Trips.route_id == route_id)
                & (Trips.direction_id == direction)
            )
        ]

    @staticmethod
    def get_trip_by_id(trip_id: str) -> Trips:
        trips = list(
            Trips.select(Trips, Routes)
            .join(Routes, on=(Routes.route_id == Trips.route_id).alias("route"))
            .where(Trips.trip_id == trip_id)
        )
        return trips[0]

    # Shapes
    @staticmethod
    def get_shapes_by_trip_id(trip_id: str) -> AggregatedShape:
        trip = Trips.get_by_id(trip_id)
        return GTFSService.get_shapes_by_shape_id(trip.shape_id)

    @staticmethod
    def get_shapes_by_shape_id(shape_id: str) -> AggregatedShape:
        return AggregatedShape.select(AggregatedShape).where(
            AggregatedShape.shape_id == shape_id
        )[0]

    # StopTimes
    @staticmethod
    def get_stop_time(trip_id: str, stop_id: str) -> StopTimes:
        return StopTimes.get(
            (StopTimes.trip_id == trip_id) & (StopTimes.stop_id == stop_id)
        )

    @staticmethod
    def get_stop_times_by_trip_id(trip_id: str) -> List[StopTimes]:
        return (
            StopTimes.select(StopTimes, Stops)
            .join(Stops, on=(Stops.stop_id == StopTimes.stop_id).alias("stop"))
            .where((StopTimes.trip_id == trip_id))
        )

    @staticmethod
    def get_stop_times_by_stop_id(
        stop_id: str, date: str, page_number: int = 1
    ) -> List[StopTimes]:
        # TODO: add index for CalendarDates
        return (
            StopTimes.select(StopTimes, Stops, Trips, Routes)
            .join(Trips, on=(StopTimes.trip_id == Trips.trip_id).alias("trip"))
            .join(Routes, on=(Routes.route_id == Trips.route_id).alias("route"))
            .join(Stops, on=(Stops.stop_id == StopTimes.stop_id))
            .join(CalendarDates, on=(CalendarDates.service_id == Trips.service_id))
            .where(
                (StopTimes.stop_id == stop_id)
                & (CalendarDates.date == date)
                & (
                    StopTimes.arrival_time
                    > (datetime.now() + timedelta(minutes=-10)).strftime("%H:%M:%S")
                )
            )
            .order_by(StopTimes.arrival_time)
        )

    @staticmethod
    def get_earliest_arrival_times_on_route(
        route_id: str, direction_id: int, date: str, time: str
    ):
        subquery = (
            StopTimes.select(
                StopTimes.stop_id,
                StopTimes.stop_sequence,
                peewee.fn.MIN(StopTimes.arrival_time).alias("arrival_time"),
            )
            .join(Trips, on=(Trips.trip_id == StopTimes.trip_id))
            .join(Routes, on=(Routes.route_id == Trips.route_id))
            .join(CalendarDates, on=(Trips.service_id == CalendarDates.service_id))
            .where(
                (StopTimes.arrival_time >= time)
                & (CalendarDates.date == date)
                & (Routes.route_id == route_id)
                & (Trips.direction_id == direction_id)
            )
            .group_by(StopTimes.stop_id, StopTimes.stop_sequence)
            .alias("subquery")
        )

        return (
            StopTimes.select(
                StopTimes.arrival_time,
                StopTimes.stop_id,
                StopTimes.stop_sequence,
                StopTimes.trip_id,
            )
            .join(Trips, on=(Trips.trip_id == StopTimes.trip_id))
            .join(
                subquery,
                on=(
                    (StopTimes.arrival_time == subquery.c.arrival_time)
                    & (StopTimes.stop_id == subquery.c.stop_id)
                ),
            )
            .join(CalendarDates, on=(Trips.service_id == CalendarDates.service_id))
            .where((CalendarDates.date == date))
            .order_by(StopTimes.stop_sequence)
        )
