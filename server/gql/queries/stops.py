"""Stop query fields."""

from typing import List

import strawberry
from strawberry.types import Info

from server.gql.types.gtfs_types import Stop
from server.gql.types.response_types import StopsAndShapes


@strawberry.type
class StopQueries:
    @strawberry.field
    async def stop(self, info: Info, stop_id: str) -> Stop:
        return await info.context.resolver.stops.resolve_stop(stop_id)

    @strawberry.field
    async def stops(self, info: Info) -> List[Stop]:
        return await info.context.resolver.stops.resolve_stops()

    @strawberry.field
    async def stops_by_name(self, info: Info, stop_name: str) -> List[Stop]:
        return await info.context.resolver.stops.resolve_stops_by_name(stop_name)

    @strawberry.field
    async def stops_and_shapes(
        self, info: Info, route_id: str, direction_id: int, date: str
    ) -> StopsAndShapes:
        return await info.context.resolver.stops.resolve_stops_and_shapes(
            route_id, direction_id, date
        )

    @strawberry.field
    async def near_by_stops(
        self,
        info: Info,
        min_lat: float,
        min_lon: float,
        max_lat: float,
        max_lon: float,
        limit: int = 20,
    ) -> List[Stop]:
        route_counts = getattr(info.context, "stop_route_counts", None)
        return await info.context.resolver.stops.resolve_near_by_stops(
            min_lat=min_lat,
            min_lon=min_lon,
            max_lat=max_lat,
            max_lon=max_lon,
            limit=limit,
            route_counts=route_counts,
        )
