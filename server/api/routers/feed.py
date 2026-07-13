"""Feed info endpoint."""

from fastapi import APIRouter, Depends

from server.api import schemas
from server.api.deps import get_gtfs_service
from server.services.gtfs_service import GTFSService

router = APIRouter(tags=["feed"])


@router.get("/feed-info", operation_id="feedInfo", response_model=schemas.FeedInfo)
async def feed_info(gtfs_service: GTFSService = Depends(get_gtfs_service)):
    return schemas.FeedInfo.model_validate(await gtfs_service.get_feed_info())
