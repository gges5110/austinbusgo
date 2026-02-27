"""Route resolver methods."""

from typing import List

from server.gql.resolvers.base import BaseResolver
from server.gql.types.gtfs_types import Route
from server.gql.types.geometry_types import LineString, geom_to_dict


class RoutesResolver(BaseResolver):
    """Resolver for route-related queries."""

    async def resolve_route(self, route_id: str) -> Route:
        return await self.gtfs_service.get_route(route_id)

    async def resolve_routes(self) -> List[Route]:
        return list(await self.gtfs_service.get_routes())

    async def resolve_route_shapes(self, trip_id: str) -> LineString:
        agg = await self.gtfs_service.get_shapes_by_trip_id(trip_id)
        return LineString.from_dict(geom_to_dict(agg.shape))
