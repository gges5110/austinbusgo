"""Route endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import NoResultFound

from server.api import schemas
from server.api.deps import get_arrival_service, get_gtfs_service
from server.services.arrival_service import ArrivalService
from server.services.geometry import geom_to_dict
from server.services.gtfs_service import GTFSService

router = APIRouter(tags=["routes"])


@router.get("/routes", operation_id="routes", response_model=List[schemas.Route])
async def routes(gtfs_service: GTFSService = Depends(get_gtfs_service)):
    return [
        schemas.Route.model_validate(row) for row in await gtfs_service.get_routes()
    ]


@router.get("/routes/{route_id}", operation_id="route", response_model=schemas.Route)
async def route(route_id: str, gtfs_service: GTFSService = Depends(get_gtfs_service)):
    try:
        return schemas.Route.model_validate(await gtfs_service.get_route(route_id))
    except NoResultFound:
        raise HTTPException(status_code=404, detail=f"Route {route_id} not found")


@router.get(
    "/routes/{route_id}/stops-and-shapes",
    operation_id="stopsAndShapes",
    response_model=schemas.StopsAndShapes,
)
async def stops_and_shapes(
    route_id: str,
    direction_id: int,
    date: str,
    gtfs_service: GTFSService = Depends(get_gtfs_service),
):
    stops = await gtfs_service.get_stops_by_route_id(route_id, direction_id)
    stops_sorted = sorted(stops, key=lambda s: s.stop_time.stop_sequence)
    shape_id_set = {s.stop_time.trip.shape_id for s in stops_sorted}
    shapes = []
    for shape_id in shape_id_set:
        agg = await gtfs_service.get_shapes_by_shape_id(shape_id)
        shapes.append(schemas.LineString.model_validate(geom_to_dict(agg.shape)))
    distinct_trips = [
        schemas.Trip.model_validate(t)
        for t in await gtfs_service.get_trips_by_distinct_short_name(route_id, date)
    ]
    return schemas.StopsAndShapes(
        stops=[schemas.Stop.model_validate(s) for s in stops_sorted],
        shapes=shapes,
        distinct_trips=distinct_trips,
    )


@router.get(
    "/routes/{route_id}/earliest-arrival-times",
    operation_id="earliestArrivalTimesOnRoute",
    response_model=List[schemas.ArrivalTimeAtStop],
)
async def earliest_arrival_times_on_route(
    route_id: str,
    direction_id: int,
    date: str,
    time: str,
    arrival_service: ArrivalService = Depends(get_arrival_service),
):
    return [
        schemas.ArrivalTimeAtStop.model_validate(row)
        for row in await arrival_service.get_earliest_arrival_times_on_route(
            route_id, direction_id, date, time
        )
    ]


@router.get(
    "/routes/{route_id}/trip-ids",
    operation_id="tripIdsForRoute",
    response_model=schemas.TripIds,
)
async def trip_ids_for_route(
    route_id: str, date: str, gtfs_service: GTFSService = Depends(get_gtfs_service)
):
    trips = await gtfs_service.get_trips_for_date(route_id, date)
    return schemas.TripIds(trip_ids=[t.trip_id for t in trips])
