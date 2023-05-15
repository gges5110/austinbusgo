import asyncio
from datetime import datetime

import graphene
from graphene import ObjectType, String

from gql.geometry_types import LineString
from gql.gtfs_rt_types import VehiclePosition
from gql.gtfs_types import Stop, Route, Trip, StopTimes
from server.gql.resolver import Resolver


class TripWithRoute(Trip):
    route = graphene.Field(graphene.NonNull(Route))


class ArrivalTime(graphene.ObjectType):
    vehicle = graphene.Field(VehiclePosition)
    scheduled_arrival_time = graphene.String(required=True)
    trip = graphene.Field(TripWithRoute, required=True)
    updated_arrival_time = graphene.String()


class StopsAndShapes(graphene.ObjectType):
    stops = graphene.List(graphene.NonNull(Stop), required=True)
    shapes = graphene.List(graphene.NonNull(LineString), required=True)


class Search(graphene.ObjectType):
    stops = graphene.List(graphene.NonNull(Stop), required=True)
    routes = graphene.List(graphene.NonNull(Route), required=True)


class TripIdsForRoute(graphene.ObjectType):
    tripIds = graphene.List(graphene.NonNull(graphene.String), required=True)


class Query(graphene.ObjectType):
    resolver = Resolver()

    arrival_times = graphene.Field(
        graphene.List(graphene.NonNull(ArrivalTime)),
        stop_id=graphene.String(required=True),
        date=graphene.String(required=True),
        resolver=resolver.resolve_arrival_times,
    )

    distinct_trips = graphene.Field(
        graphene.List(graphene.NonNull(Trip)),
        route_id=graphene.String(required=True),
        date=graphene.String(required=True),
        resolver=resolver.resolve_distinct_trips,
    )

    near_by_stops = graphene.Field(
        graphene.NonNull(graphene.List(graphene.NonNull(Stop))),
        lat=graphene.Float(required=True),
        lon=graphene.Float(required=True),
        resolver=resolver.resolve_near_by_stops,
    )

    real_time_vehicle_positions = graphene.Field(
        graphene.List(VehiclePosition),
        resolver=resolver.resolve_vehicle_positions_debug,
    )

    route = graphene.Field(
        graphene.NonNull(Route),
        route_id=graphene.String(required=True),
        resolver=resolver.resolve_route,
    )

    routes = graphene.Field(
        graphene.List(graphene.NonNull(Route)), resolver=resolver.resolve_routes
    )

    route_shapes = graphene.Field(
        graphene.NonNull(LineString),
        trip_id=graphene.String(required=True),
        resolver=resolver.resolve_route_shapes,
    )

    search = graphene.Field(
        graphene.NonNull(Search),
        search_term=graphene.String(required=True),
        resolver=resolver.resolve_search,
    )

    stop = graphene.Field(
        graphene.NonNull(Stop),
        stop_id=graphene.String(required=True),
        resolver=resolver.resolve_stop,
    )

    stops_and_shapes = graphene.Field(
        graphene.NonNull(StopsAndShapes),
        route_id=graphene.String(required=True),
        direction_id=graphene.Int(required=True),
        date=graphene.String(required=True),
        resolver=resolver.resolve_stops_and_shapes,
    )

    stops_by_name = graphene.Field(
        graphene.List(graphene.NonNull(Stop)),
        stop_name=graphene.String(required=True),
        resolver=resolver.resolve_stops_by_name,
    )

    stop_times = graphene.Field(
        graphene.List(graphene.NonNull(StopTimes)),
        trip_id=graphene.String(required=True),
        resolver=resolver.resolve_stop_times,
    )

    trip = graphene.Field(
        graphene.NonNull(TripWithRoute),
        trip_id=graphene.String(required=True),
        resolver=resolver.resolve_trip,
    )

    trip_ids_for_route = graphene.Field(
        graphene.NonNull(TripIdsForRoute),
        route_id=graphene.String(required=True),
        date=graphene.String(required=True),
        resolver=resolver.resolve_trip_ids_for_route,
    )

    vehicle_positions = graphene.Field(
        graphene.List(graphene.NonNull(VehiclePosition)),
        route_id=graphene.String(required=True),
        direction=graphene.Int(required=True),
        resolver=resolver.resolve_vehicle_positions,
    )


class Subscription(ObjectType):
    time_of_day = String()

    async def subscribe_time_of_day(root, info):
        while True:
            yield datetime.now().isoformat()
            await asyncio.sleep(1)


schema = graphene.Schema(query=Query)
