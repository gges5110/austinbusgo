"""Response-only types not backed by ORM models."""

from typing import List, Optional

import strawberry

from server.gql.types.geometry_types import LineString
from server.gql.types.gtfs_types import Route, Stop, Trip


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
