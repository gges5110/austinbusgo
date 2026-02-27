"""Real-time query fields for vehicle positions and trip updates."""

from typing import List, Optional

import strawberry
from strawberry.types import Info

from server.gql.types.gtfs_rt_types import VehiclePosition, TripUpdate
from server.gql.inputs.gtfs_inputs import TripUpdatesFilter


@strawberry.type
class RealTimeQueries:
    @strawberry.field
    async def vehicle_positions(
        self, info: Info, route_id: str, direction: int
    ) -> List[VehiclePosition]:
        return await info.context.resolver.real_time.resolve_vehicle_positions(
            route_id, direction
        )

    @strawberry.field
    def real_time_vehicle_positions(self, info: Info) -> List[VehiclePosition]:
        return info.context.resolver.real_time.resolve_vehicle_positions_debug()

    @strawberry.field
    def trip_update(self, info: Info, trip_id: str) -> Optional[TripUpdate]:
        return info.context.resolver.real_time.resolve_trip_update(trip_id)

    @strawberry.field
    def trip_updates(
        self,
        info: Info,
        filter: Optional[TripUpdatesFilter] = None,
    ) -> List[TripUpdate]:
        route_id = filter.route_id if filter else None
        trip_id = filter.trip_id if filter else None
        return info.context.resolver.real_time.resolve_trip_updates(
            route_id=route_id, trip_id=trip_id
        )
