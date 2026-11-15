"""Health of everything the site depends on, for the /dev/status page.

Under /rt so the edge cache keeps it for 15 seconds at most; the status
page calls Cloud Run directly to see the backend's own latency.
"""

import asyncio
import os
import time
from typing import Optional

from fastapi import APIRouter, Depends

from server.api import schemas
from server.api.deps import get_gtfs_service
from server.config import (
    capital_metro_trip_updates_pb_file_url,
    capital_metro_vehicle_positions_pb_file_url,
    db_path,
)
from server.services.gtfs_rt_client import GTFSRTClient, RealtimeFeedError, feed_stats
from server.services.gtfs_service import GTFSService

router = APIRouter(prefix="/rt", tags=["status"])

# When this worker process started: a young one means a cold start
STARTED_AT = time.time()

FEEDS = {
    "tripUpdates": capital_metro_trip_updates_pb_file_url,
    "vehiclePositions": capital_metro_vehicle_positions_pb_file_url,
}


async def _check_feed(name: str, url: str) -> schemas.RealtimeFeedStatus:
    client = GTFSRTClient(
        capital_metro_trip_updates_pb_file_url,
        capital_metro_vehicle_positions_pb_file_url,
    )
    error: Optional[str] = None
    try:
        await client._get_feed_message_entity_from_url(url)
    except RealtimeFeedError as failure:
        error = str(failure)[:200] or "fetch failed"
    return schemas.RealtimeFeedStatus(
        name=name, ok=error is None, error=error, **feed_stats(url)
    )


@router.get("/status", operation_id="status", response_model=schemas.Status)
async def status(gtfs_service: GTFSService = Depends(get_gtfs_service)):
    now = time.time()
    feed = await gtfs_service.get_feed_info()
    built_at = (
        os.path.getmtime(db_path) if db_path and os.path.exists(db_path) else None
    )
    return schemas.Status(
        now=now,
        started_at=STARTED_AT,
        revision=os.environ.get("K_REVISION"),
        feed_version=feed.feed_version,
        feed_start_date=feed.feed_start_date,
        feed_end_date=feed.feed_end_date,
        database_built_at=built_at,
        realtime=await asyncio.gather(
            *(_check_feed(name, url) for name, url in FEEDS.items())
        ),
    )
