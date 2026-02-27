"""Trip resolver methods."""

from typing import List

from server.gql.resolvers.base import BaseResolver
from server.gql.types.gtfs_types import Trip, StopTimes
from server.gql.types.response_types import TripIdsForRoute


class TripsResolver(BaseResolver):
    """Resolver for trip-related queries."""

    async def resolve_trip(self, trip_id: str) -> Trip:
        return await self.gtfs_service.get_trip_by_id(trip_id)

    async def resolve_distinct_trips(self, route_id: str, date: str) -> List[Trip]:
        return list(
            await self.gtfs_service.get_trips_by_distinct_short_name(route_id, date)
        )

    async def resolve_trip_ids_for_route(
        self, route_id: str, date: str
    ) -> TripIdsForRoute:
        trips = await self.gtfs_service.get_trips_for_date(route_id, date)
        return TripIdsForRoute(trip_ids=[t.trip_id for t in trips])

    async def resolve_stop_times(self, trip_id: str) -> List[StopTimes]:
        return list(await self.gtfs_service.get_stop_times_by_trip_id(trip_id))
