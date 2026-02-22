from typing import List, Optional

import strawberry
from strawberry.types import Info

from server.gql.inputs.gtfs_inputs import TripUpdatesFilter
from server.gql.types.geometry_types import LineString
from server.gql.types.gtfs_rt_types import TripUpdate, VehiclePosition
from server.gql.types.gtfs_types import FeedInfo, Route, Stop, StopTimes, Trip


# ---------------------------------------------------------------------------
# Response-only types (not backed by Peewee models)
# ---------------------------------------------------------------------------


@strawberry.type
class ArrivalTime:
    scheduled_arrival_time: str
    trip: Trip
    updated_arrival_time: Optional[str] = None


@strawberry.type
class StopsAndShapes:
    stops: List[Stop]
    shapes: List[LineString]


@strawberry.type
class Search:
    stops: List[Stop]
    routes: List[Route]


@strawberry.type
class TripIdsForRoute:
    # snake_case → tripIds in GraphQL (camelCase auto-conversion)
    trip_ids: List[str]


@strawberry.type
class ArrivalTimeAtStop:
    stop_id: str
    stop_sequence: int
    scheduled_arrival_time: str
    trip_id: Optional[str] = None
    updated_arrival_time: Optional[str] = None


# ---------------------------------------------------------------------------
# Query
# ---------------------------------------------------------------------------


@strawberry.type
class Query:
    @strawberry.field
    def arrival_times(self, info: Info, stop_id: str, date: str) -> List[ArrivalTime]:
        results = info.context.resolver.resolve_arrival_times(None, None, stop_id, date)
        return [
            ArrivalTime(
                scheduled_arrival_time=r["scheduled_arrival_time"],
                trip=r["trip"],
                updated_arrival_time=r.get("updated_arrival_time"),
            )
            for r in results
        ]

    @strawberry.field
    def distinct_trips(self, info: Info, route_id: str, date: str) -> List[Trip]:
        return list(
            info.context.resolver.resolve_distinct_trips(None, None, route_id, date)
        )

    @strawberry.field
    def earliest_arrival_times_on_route(
        self,
        info: Info,
        route_id: str,
        direction_id: int,
        date: str,
        time: str,
    ) -> List[ArrivalTimeAtStop]:
        results = info.context.resolver.resolve_earliest_arrival_times_on_route(
            None, None, route_id, direction_id, date, time
        )
        return [
            ArrivalTimeAtStop(
                stop_id=r["stop_id"],
                stop_sequence=r["stop_sequence"],
                scheduled_arrival_time=r["scheduled_arrival_time"],
                trip_id=r.get("trip_id"),
                updated_arrival_time=r.get("updated_arrival_time"),
            )
            for r in results
        ]

    @strawberry.field
    def feed_info(self, info: Info) -> FeedInfo:
        return info.context.resolver.resolve_feed_info(None, None)

    @strawberry.field
    def near_by_stops(
        self,
        info: Info,
        lat: float,
        lon: float,
        radius: float = 1000.0,
        limit: int = 20,
        min_lat: Optional[float] = None,
        min_lon: Optional[float] = None,
        max_lat: Optional[float] = None,
        max_lon: Optional[float] = None,
    ) -> List[Stop]:
        return list(
            info.context.resolver.resolve_near_by_stops(
                None,
                None,
                lat=lat,
                lon=lon,
                radius=radius,
                limit=limit,
                min_lat=min_lat,
                min_lon=min_lon,
                max_lat=max_lat,
                max_lon=max_lon,
            )
        )

    @strawberry.field
    def real_time_vehicle_positions(self, info: Info) -> List[VehiclePosition]:
        protos = info.context.resolver.resolve_vehicle_positions_debug(None, None)
        return [VehiclePosition.from_proto(vp) for vp in protos]

    @strawberry.field
    def route(self, info: Info, route_id: str) -> Route:
        return info.context.resolver.resolve_route(None, None, route_id)

    @strawberry.field
    def routes(self, info: Info) -> List[Route]:
        return list(info.context.resolver.resolve_routes(None, None))

    @strawberry.field
    def route_shapes(self, info: Info, trip_id: str) -> LineString:
        shape = info.context.resolver.resolve_route_shapes(None, None, trip_id)
        return LineString.from_dict(shape)

    @strawberry.field
    def search(self, info: Info, search_term: str) -> Search:
        result = info.context.resolver.resolve_search(None, None, search_term)
        return Search(
            stops=list(result["stops"]),
            routes=list(result["routes"]),
        )

    @strawberry.field
    def stop(self, info: Info, stop_id: str) -> Stop:
        return info.context.resolver.resolve_stop(None, None, stop_id)

    @strawberry.field
    def stops_and_shapes(
        self, info: Info, route_id: str, direction_id: int, date: str
    ) -> StopsAndShapes:
        result = info.context.resolver.resolve_stops_and_shapes(
            None, None, route_id, direction_id, date
        )
        return StopsAndShapes(
            stops=list(result["stops"]),
            shapes=[LineString.from_dict(s) for s in result["shapes"]],
        )

    @strawberry.field
    def stops_by_name(self, info: Info, stop_name: str) -> List[Stop]:
        return list(info.context.resolver.resolve_stops_by_name(None, None, stop_name))

    @strawberry.field
    def stop_times(self, info: Info, trip_id: str) -> List[StopTimes]:
        return list(info.context.resolver.resolve_stop_times(None, None, trip_id))

    @strawberry.field
    def trip(self, info: Info, trip_id: str) -> Trip:
        return info.context.resolver.resolve_trip(None, None, trip_id)

    @strawberry.field
    def trip_ids_for_route(
        self, info: Info, route_id: str, date: str
    ) -> TripIdsForRoute:
        result = info.context.resolver.resolve_trip_ids_for_route(
            None, None, route_id, date
        )
        return TripIdsForRoute(trip_ids=result["tripIds"])

    @strawberry.field
    def trip_update(self, info: Info, trip_id: str) -> Optional[TripUpdate]:
        proto = info.context.resolver.resolve_trip_update(None, None, trip_id)
        return TripUpdate.from_proto(proto) if proto is not None else None

    @strawberry.field
    def trip_updates(
        self,
        info: Info,
        filter: Optional[TripUpdatesFilter] = None,
    ) -> List[TripUpdate]:
        protos = info.context.resolver.resolve_trip_updates(None, None, filter)
        return [TripUpdate.from_proto(p) for p in protos]

    @strawberry.field
    def vehicle_positions(
        self, info: Info, route_id: str, direction: int
    ) -> List[VehiclePosition]:
        protos = info.context.resolver.resolve_vehicle_positions(
            None, None, route_id, direction
        )
        return [VehiclePosition.from_proto(vp) for vp in protos]


schema = strawberry.Schema(query=Query)
