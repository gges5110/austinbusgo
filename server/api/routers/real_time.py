"""GTFS-RT endpoints (vehicle positions, trip updates)."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from server.api import schemas
from server.api.deps import get_rt_service
from server.services.gtfs_rt_service import GTFSRTService

router = APIRouter(prefix="/rt", tags=["real-time"])


@router.get(
    "/vehicle-positions",
    operation_id="vehiclePositions",
    response_model=List[schemas.VehiclePosition],
)
async def vehicle_positions(
    route_id: Optional[str] = None,
    direction: Optional[int] = None,
    rt_service: GTFSRTService = Depends(get_rt_service),
):
    """All vehicles when no filter is given, else vehicles on a route+direction."""
    if route_id is None:
        protos = rt_service.get_real_time_vehicle_positions()
    else:
        if direction is None:
            raise HTTPException(
                status_code=422, detail="direction is required with route_id"
            )
        protos = await rt_service.get_real_time_vehicle_positions_on_route(
            route_id, direction
        )
    return [schemas.VehiclePosition.from_proto(p) for p in protos]


@router.get(
    "/trip-updates/{trip_id}",
    operation_id="tripUpdate",
    response_model=Optional[schemas.TripUpdate],
)
async def trip_update(
    trip_id: str, rt_service: GTFSRTService = Depends(get_rt_service)
):
    trip_updates = rt_service.get_all_real_time_trip_updates(trip_id=trip_id)
    return schemas.TripUpdate.from_proto(trip_updates[0]) if trip_updates else None
