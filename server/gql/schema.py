import graphene

from server.gql.geometry_types import LineString
from server.gql.gtfs_rt_types import VehiclePosition, TripUpdate
from server.gql.gtfs_types import Stop, Route, Trip, StopTimes
from server.gql.resolver import Resolver


class ArrivalTime(graphene.ObjectType):
    scheduled_arrival_time = graphene.String(required=True)
    trip = graphene.Field(Trip, required=True)
    updated_arrival_time = graphene.String()


class StopsAndShapes(graphene.ObjectType):
    stops = graphene.List(graphene.NonNull(Stop), required=True)
    shapes = graphene.List(graphene.NonNull(LineString), required=True)


class Search(graphene.ObjectType):
    stops = graphene.List(graphene.NonNull(Stop), required=True)
    routes = graphene.List(graphene.NonNull(Route), required=True)


class TripIdsForRoute(graphene.ObjectType):
    tripIds = graphene.List(graphene.NonNull(graphene.String), required=True)


class ArrivalTimeAtStop(graphene.ObjectType):
    stop_id = graphene.String(
        description="Identifies a stop, station, or station entrance.", required=True
    )
    stop_sequence = graphene.Int(required=True)
    trip_id = graphene.String()
    scheduled_arrival_time = graphene.String(required=True)
    updated_arrival_time = graphene.String()


class TripUpdatesFilter(graphene.InputObjectType):
    trip_id = graphene.String()
    route_id = graphene.String()


class Query(graphene.ObjectType):
    resolver = Resolver()

    arrival_times = graphene.Field(
        graphene.NonNull(graphene.List(graphene.NonNull(ArrivalTime))),
        stop_id=graphene.String(required=True),
        date=graphene.String(required=True),
        resolver=resolver.resolve_arrival_times,
    )

    distinct_trips = graphene.Field(
        graphene.NonNull(graphene.List(graphene.NonNull(Trip))),
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
        graphene.NonNull(graphene.List(VehiclePosition)),
        resolver=resolver.resolve_vehicle_positions_debug,
    )

    route = graphene.Field(
        graphene.NonNull(Route),
        route_id=graphene.String(required=True),
        resolver=resolver.resolve_route,
    )

    routes = graphene.Field(
        graphene.NonNull(graphene.List(graphene.NonNull(Route))),
        resolver=resolver.resolve_routes,
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
        graphene.NonNull(graphene.List(graphene.NonNull(Stop))),
        stop_name=graphene.String(required=True),
        resolver=resolver.resolve_stops_by_name,
    )

    stop_times = graphene.Field(
        graphene.NonNull(graphene.List(graphene.NonNull(StopTimes))),
        trip_id=graphene.String(required=True),
        resolver=resolver.resolve_stop_times,
    )

    earliest_arrival_times_on_route = graphene.Field(
        graphene.NonNull(graphene.List(graphene.NonNull(ArrivalTimeAtStop))),
        route_id=graphene.String(required=True),
        direction_id=graphene.Int(required=True),
        date=graphene.String(required=True),
        time=graphene.String(required=True),
        resolver=resolver.resolve_earliest_arrival_times_on_route,
    )

    trip = graphene.Field(
        graphene.NonNull(Trip),
        trip_id=graphene.String(required=True),
        resolver=resolver.resolve_trip,
    )

    trip_ids_for_route = graphene.Field(
        graphene.NonNull(TripIdsForRoute),
        route_id=graphene.String(required=True),
        date=graphene.String(required=True),
        resolver=resolver.resolve_trip_ids_for_route,
    )

    trip_update = graphene.Field(
        TripUpdate,
        trip_id=graphene.String(required=True),
        resolver=resolver.resolve_trip_update,
    )

    trip_updates = graphene.Field(
        graphene.NonNull(graphene.List(graphene.NonNull(TripUpdate))),
        filter=TripUpdatesFilter(),
        resolver=resolver.resolve_trip_updates,
    )

    vehicle_positions = graphene.Field(
        graphene.NonNull(graphene.List(graphene.NonNull(VehiclePosition))),
        route_id=graphene.String(required=True),
        direction=graphene.Int(required=True),
        resolver=resolver.resolve_vehicle_positions,
    )


schema = graphene.Schema(query=Query)
