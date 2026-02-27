"""Route query fields."""

from typing import List

import strawberry
from strawberry.types import Info

from server.gql.types.gtfs_types import Route
from server.gql.types.geometry_types import LineString


@strawberry.type
class RouteQueries:
    @strawberry.field
    async def route(self, info: Info, route_id: str) -> Route:
        return await info.context.resolver.routes.resolve_route(route_id)

    @strawberry.field
    async def routes(self, info: Info) -> List[Route]:
        return await info.context.resolver.routes.resolve_routes()

    @strawberry.field
    async def route_shapes(self, info: Info, trip_id: str) -> LineString:
        return await info.context.resolver.routes.resolve_route_shapes(trip_id)
