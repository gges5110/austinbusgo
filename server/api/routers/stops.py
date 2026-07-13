"""Stop endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import NoResultFound

from server.api import schemas
from server.api.deps import get_arrival_service, get_gtfs_service
from server.services.arrival_service import ArrivalService
from server.services.gtfs_service import GTFSService

router = APIRouter(tags=["stops"])


async def _with_routes(rows, gtfs_service: GTFSService) -> List[schemas.Stop]:
    """Validate stop rows and attach their routes in one batched query."""
    stops = [schemas.Stop.model_validate(row) for row in rows]
    routes_by_stop = await gtfs_service.get_routes_at_stops([s.stop_id for s in stops])
    for stop in stops:
        stop.routes = [
            schemas.Route.model_validate(r) for r in routes_by_stop[stop.stop_id]
        ]
    return stops


@router.get("/stops", operation_id="allStops", response_model=List[schemas.Stop])
async def all_stops(gtfs_service: GTFSService = Depends(get_gtfs_service)):
    rows = await gtfs_service.get_stops()
    return await _with_routes(rows, gtfs_service)


@router.get(
    "/stops/nearby", operation_id="nearByStops", response_model=List[schemas.Stop]
)
async def near_by_stops(
    request: Request,
    min_lat: float,
    min_lon: float,
    max_lat: float,
    max_lon: float,
    limit: int = 20,
    gtfs_service: GTFSService = Depends(get_gtfs_service),
):
    cache = getattr(request.app.state, "stop_routes_cache", None)
    route_counts = (
        {stop_id: len(routes) for stop_id, routes in cache.items()}
        if cache is not None
        else None
    )
    rows = (
        await gtfs_service.get_near_by_stops(
            min_lat=min_lat,
            min_lon=min_lon,
            max_lat=max_lat,
            max_lon=max_lon,
            limit=limit,
            route_counts=route_counts,
        )
        or []
    )
    return await _with_routes(rows, gtfs_service)


@router.get(
    "/stops/by-name", operation_id="stopsByName", response_model=List[schemas.Stop]
)
async def stops_by_name(
    name: str, gtfs_service: GTFSService = Depends(get_gtfs_service)
):
    rows = await gtfs_service.get_stops_by_name(name) or []
    return [schemas.Stop.model_validate(row) for row in rows]


@router.get("/stops/{stop_id}", operation_id="stop", response_model=schemas.Stop)
async def stop(stop_id: str, gtfs_service: GTFSService = Depends(get_gtfs_service)):
    try:
        row = await gtfs_service.get_stop(stop_id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail=f"Stop {stop_id} not found")
    result = schemas.Stop.model_validate(row)
    result.routes = [
        schemas.Route.model_validate(r)
        for r in await gtfs_service.get_routes_at_stop(stop_id)
    ]
    return result


@router.get(
    "/stops/{stop_id}/arrival-times",
    operation_id="arrivalTimes",
    response_model=List[schemas.ArrivalTime],
)
async def arrival_times(
    stop_id: str,
    date: str,
    arrival_service: ArrivalService = Depends(get_arrival_service),
):
    return [
        schemas.ArrivalTime.model_validate(row)
        for row in await arrival_service.get_arrival_times(stop_id, date)
    ]
