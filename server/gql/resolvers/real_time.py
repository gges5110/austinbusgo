"""Real-time resolver methods for vehicle positions and trip updates."""

from typing import List, Optional

from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate

from server.gql.resolvers.base import BaseResolver
from server.gql.types.gtfs_rt_types import VehiclePosition as VehiclePositionType
from server.gql.types.gtfs_rt_types import TripUpdate as TripUpdateType


class RealTimeResolver(BaseResolver):
    """Resolver for real-time data (vehicle positions, trip updates)."""

    async def resolve_vehicle_positions(
        self, route_id: str, direction: int
    ) -> List[VehiclePositionType]:
        protos = await self.gtfs_rt_service.get_real_time_vehicle_positions_on_route(
            route_id, direction
        )
        return [VehiclePositionType.from_proto(vp) for vp in protos]

    def resolve_vehicle_positions_debug(self) -> List[VehiclePositionType]:
        protos = self.gtfs_rt_service.get_real_time_vehicle_positions()
        return [VehiclePositionType.from_proto(vp) for vp in protos]

    def resolve_trip_update(self, trip_id: str) -> Optional[TripUpdateType]:
        trip_updates = self.gtfs_rt_service.get_all_real_time_trip_updates(
            trip_id=trip_id
        )
        return TripUpdateType.from_proto(trip_updates[0]) if trip_updates else None

    def resolve_trip_updates(
        self,
        route_id: Optional[str] = None,
        trip_id: Optional[str] = None,
    ) -> List[TripUpdateType]:
        protos = self.gtfs_rt_service.get_all_real_time_trip_updates(
            route_id=route_id, trip_id=trip_id
        )
        return [TripUpdateType.from_proto(p) for p in protos]
