"""Trip endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import NoResultFound

from server.api import schemas
from server.api.deps import get_gtfs_service
from server.services.gtfs_service import GTFSService

router = APIRouter(tags=["trips"])


@router.get("/trips/{trip_id}", operation_id="trip", response_model=schemas.Trip)
async def trip(trip_id: str, gtfs_service: GTFSService = Depends(get_gtfs_service)):
    try:
        return schemas.Trip.model_validate(await gtfs_service.get_trip_by_id(trip_id))
    except NoResultFound:
        raise HTTPException(status_code=404, detail=f"Trip {trip_id} not found")


@router.get(
    "/trips/{trip_id}/stop-times",
    operation_id="stopTimes",
    response_model=List[schemas.StopTime],
)
async def stop_times(
    trip_id: str, gtfs_service: GTFSService = Depends(get_gtfs_service)
):
    return [
        schemas.StopTime.model_validate(row)
        for row in await gtfs_service.get_stop_times_by_trip_id(trip_id)
    ]
