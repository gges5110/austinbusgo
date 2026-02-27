"""Trip query fields."""

from typing import List

import strawberry
from strawberry.types import Info

from server.gql.types.gtfs_types import Trip, StopTimes
from server.gql.types.response_types import TripIdsForRoute


@strawberry.type
class TripQueries:
    @strawberry.field
    async def trip(self, info: Info, trip_id: str) -> Trip:
        return await info.context.resolver.trips.resolve_trip(trip_id)

    @strawberry.field
    async def distinct_trips(self, info: Info, route_id: str, date: str) -> List[Trip]:
        return await info.context.resolver.trips.resolve_distinct_trips(route_id, date)

    @strawberry.field
    async def trip_ids_for_route(
        self, info: Info, route_id: str, date: str
    ) -> TripIdsForRoute:
        return await info.context.resolver.trips.resolve_trip_ids_for_route(
            route_id, date
        )

    @strawberry.field
    async def stop_times(self, info: Info, trip_id: str) -> List[StopTimes]:
        return await info.context.resolver.trips.resolve_stop_times(trip_id)
