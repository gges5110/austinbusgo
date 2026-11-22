from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
import hmac
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from server import logging_config  # noqa: F401 - Configure logging on import
from server import config
from server.config import db_path
from server import database

logger = logging.getLogger(__name__)
from server.api.routers import api_router
from server.database import (
    database_sanity_check,
    init_database,
)
from server.services.gtfs_rt_client import RealtimeFeedError, warm_realtime_feeds
from server.services.gtfs_service import GTFSService


@asynccontextmanager
async def lifespan(app: FastAPI):
    if db_path is None:
        raise RuntimeError("Environment variable $GTFS_DB_PATH was not set")
    init_database(db_path)
    async with database.AsyncSessionLocal() as session:
        await database_sanity_check(session)
        # Used by the nearby-stops ranking to weight stops by route count
        app.state.stop_routes_cache = await GTFSService(
            session
        ).get_all_routes_at_stops()
    # Start downloading the realtime feeds now, so a fresh worker's first
    # rider doesn't wait on data.texas.gov (requests join this fetch)
    warm = asyncio.create_task(warm_realtime_feeds())
    yield
    warm.cancel()


# Reachable without the edge-cache secret
OPEN_PATHS = {"/api/rt/status"}


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    # Only the edge-cache worker may call the backend (it adds the shared
    # secret). /api/rt/status stays open: the status page times the backend
    # directly, and it is cheap (one row plus the shared, cached feeds).
    @app.middleware("http")
    async def require_origin_secret(request: Request, call_next):
        secret = config.origin_secret
        if (
            secret
            and request.url.path not in OPEN_PATHS
            and not hmac.compare_digest(
                request.headers.get("X-Origin-Auth", ""), secret
            )
        ):
            return JSONResponse(status_code=403, content={"detail": "Forbidden"})
        return await call_next(request)

    # Live-bus endpoints when data.texas.gov is down or slow: say so (503,
    # never cached by the edge) instead of a bare 500
    @app.exception_handler(RealtimeFeedError)
    async def realtime_unavailable(_request: Request, error: RealtimeFeedError):
        return JSONResponse(
            status_code=503,
            content={"detail": f"CapMetro realtime feed unavailable: {error}"},
        )

    return app


app = create_app()
