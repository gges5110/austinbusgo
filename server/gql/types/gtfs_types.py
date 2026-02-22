from typing import List, Optional

import strawberry

from server.gql.types.geometry_types import Point
from server.services.gtfs_service import GTFSService


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

    @strawberry.field
    def stop_loc(self) -> Optional[Point]:
        # self is a Peewee Stops model instance; GeometryField returns a GeoJSON dict
        raw = getattr(self, "stop_loc", None)
        if raw is None or not isinstance(raw, dict):
            return None
        return Point.from_dict(raw)

    @strawberry.field
    def routes(self) -> List[Route]:
        return list(GTFSService.get_routes_at_stop(self.stop_id))


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
    def route(self) -> Optional[Route]:
        # self is a Peewee Trips instance; 'route' may be a join alias
        return getattr(self, "route", None)


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
