"""Stop resolver methods."""

from typing import List, Optional, Dict

from server.gql.resolvers.base import BaseResolver
from server.gql.types.gtfs_types import Stop
from server.gql.types.response_types import StopsAndShapes
from server.gql.types.geometry_types import LineString, geom_to_dict


class StopsResolver(BaseResolver):
    """Resolver for stop-related queries."""

    async def resolve_stop(self, stop_id: str) -> Stop:
        return await self.gtfs_service.get_stop(stop_id)

    async def resolve_stops(self) -> List[Stop]:
        return list(await self.gtfs_service.get_stops())

    async def resolve_stops_by_name(self, stop_name: str) -> List[Stop]:
        return list(
            await self.gtfs_service.get_stops_by_name(stop_name.split(" ")) or []
        )

    async def resolve_stops_and_shapes(
        self, route_id: str, direction_id: int, date: str
    ) -> StopsAndShapes:
        stops = await self.gtfs_service.get_stops_by_route_id(route_id, direction_id)
        stops_sorted = sorted(stops, key=lambda s: s.stop_time.stop_sequence)
        shape_id_set = {s.stop_time.trip.shape_id for s in stops_sorted}
        shapes = []
        for shape_id in shape_id_set:
            agg = await self.gtfs_service.get_shapes_by_shape_id(shape_id)
            shapes.append(agg.shape)
        return StopsAndShapes(
            stops=stops_sorted,
            shapes=[LineString.from_dict(geom_to_dict(s)) for s in shapes],
        )

    async def resolve_near_by_stops(
        self,
        min_lat: float,
        min_lon: float,
        max_lat: float,
        max_lon: float,
        limit: int = 20,
        route_counts: Optional[Dict] = None,
    ) -> List[Stop]:
        return (
            await self.gtfs_service.get_near_by_stops(
                min_lat=min_lat,
                min_lon=min_lon,
                max_lat=max_lat,
                max_lon=max_lon,
                limit=limit,
                route_counts=route_counts,
            )
            or []
        )
