"""Search endpoint."""

from fastapi import APIRouter, Depends

from server.api import schemas
from server.api.deps import get_gtfs_service
from server.services.gtfs_service import GTFSService

router = APIRouter(tags=["search"])


@router.get("/search", operation_id="search", response_model=schemas.SearchResult)
async def search(
    q: str, limit: int = 8, gtfs_service: GTFSService = Depends(get_gtfs_service)
):
    stop_rows = await gtfs_service.get_stops_by_name(q, limit=limit)
    stops = [schemas.Stop.model_validate(row) for row in stop_rows]
    routes_by_stop = await gtfs_service.get_routes_at_stops([s.stop_id for s in stops])
    for stop in stops:
        stop.routes = [
            schemas.Route.model_validate(r) for r in routes_by_stop[stop.stop_id]
        ]
    routes = [
        schemas.Route.model_validate(row)
        for row in await gtfs_service.get_routes_by_name(q, limit=limit)
    ]
    return schemas.SearchResult(stops=stops, routes=routes)
