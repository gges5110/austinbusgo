"""Arrival time query fields."""

from typing import List

import strawberry
from strawberry.types import Info

from server.gql.types.response_types import ArrivalTime, ArrivalTimeAtStop


@strawberry.type
class ArrivalQueries:
    @strawberry.field
    async def arrival_times(
        self, info: Info, stop_id: str, date: str
    ) -> List[ArrivalTime]:
        return await info.context.resolver.arrivals.resolve_arrival_times(stop_id, date)

    @strawberry.field
    async def earliest_arrival_times_on_route(
        self,
        info: Info,
        route_id: str,
        direction_id: int,
        date: str,
        time: str,
    ) -> List[ArrivalTimeAtStop]:
        return await info.context.resolver.arrivals.resolve_earliest_arrival_times_on_route(
            route_id, direction_id, date, time
        )
