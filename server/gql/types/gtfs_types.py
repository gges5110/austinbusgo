from typing import List, Optional

import strawberry
from strawberry.types import Info

from server.gql.types.geometry_types import Point, geom_to_dict


@strawberry.type
class Route:
    route_id: str
    agency_id: Optional[str] = None
    route_short_name: Optional[str] = None
    route_long_name: str
    route_color: Optional[str] = None


@strawberry.type
class Stop:
    stop_id: str
    stop_code: Optional[str] = None
    stop_name: Optional[str] = None
    stop_desc: Optional[str] = None
    stop_url: Optional[str] = None
    wheelchair_boarding: Optional[int] = None
    on_street: Optional[str] = None
    at_street: Optional[str] = None

    @strawberry.field
    def stop_loc(self) -> Optional[Point]:
        d = geom_to_dict(getattr(self, "stop_loc", None))
        if d is None:
            return None
        return Point.from_dict(d)

    @strawberry.field
    async def routes(self, info: Info) -> List[Route]:
        # Try to use dataloader first (prevents N+1 queries)
        dataloaders = getattr(info.context, "dataloaders", {})
        routes_loader = dataloaders.get("routes_by_stop")
        if routes_loader is not None:
            return await routes_loader.load(self.stop_id)

        # Fall back to cache
        cache = getattr(info.context, "stop_routes_cache", None)
        if cache is not None:
            return cache.get(self.stop_id, [])

        # Fall back to direct query
        from server.services.gtfs_service import GTFSService

        return await GTFSService(info.context.session).get_routes_at_stop(self.stop_id)


@strawberry.type
class Trip:
    route_id: str
    service_id: str
    trip_id: str
    trip_headsign: Optional[str] = None
    direction_id: Optional[int] = None
    block_id: Optional[str] = None
    shape_id: Optional[str] = None
    scheduled_trip_id: Optional[str] = None
    trip_short_name: Optional[str] = None
    wheelchair_accessible: Optional[int] = None
    bikes_allowed: Optional[int] = None

    @strawberry.field
    async def route(self, info: Info) -> Optional[Route]:
        # Check if route is already loaded on the object
        if hasattr(self, "route") and self.route is not None:
            return self.route

        # Use dataloader to batch-load route by ID (prevents N+1)
        dataloaders = getattr(info.context, "dataloaders", {})
        route_loader = dataloaders.get("route_by_id")
        if route_loader is not None:
            return await route_loader.load(self.route_id)

        # Fall back to direct query
        from server.services.gtfs_service import GTFSService

        return await GTFSService(info.context.session).get_route(self.route_id)

    @strawberry.field
    async def stop_times(self, info: Info) -> List["StopTimes"]:
        # Use dataloader to batch-load stop times by trip ID (prevents N+1)
        dataloaders = getattr(info.context, "dataloaders", {})
        stop_times_loader = dataloaders.get("stop_times_by_trip")
        if stop_times_loader is not None:
            return await stop_times_loader.load(self.trip_id)

        # Fall back to direct query
        from server.services.gtfs_service import GTFSService

        return await GTFSService(info.context.session).get_stop_times_by_trip_id(
            self.trip_id
        )


@strawberry.type
class StopTimes:
    trip_id: str
    arrival_time: str
    departure_time: str
    stop_id: str
    stop_sequence: int
    pickup_type: Optional[int] = None
    drop_off_type: Optional[int] = None
    shape_dist_traveled: Optional[float] = None
    timepoint: Optional[int] = None

    @strawberry.field
    def stop(self) -> Optional[Stop]:
        return getattr(self, "stop", None)

    @strawberry.field
    def trip(self) -> Optional[Trip]:
        return getattr(self, "trip", None)


@strawberry.type
class FeedInfo:
    feed_publisher_name: str
    feed_publisher_url: str
    feed_lang: str
    feed_start_date: Optional[str] = None
    feed_end_date: Optional[str] = None
    feed_version: Optional[str] = None
