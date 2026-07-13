from __future__ import annotations

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server import logging_config  # noqa: F401 - Configure logging on import
from server.config import db_url
from server import database

logger = logging.getLogger(__name__)
from server.api.routers import api_router
from server.database import (
    database_sanity_check,
    init_database,
)
from server.services.gtfs_service import GTFSService


@asynccontextmanager
async def lifespan(app: FastAPI):
    if db_url is None:
        raise RuntimeError("Environment variable $DATABASE_URL was not set")
    init_database(db_url)
    async with database.AsyncSessionLocal() as session:
        await database_sanity_check(session)
        # Used by the nearby-stops ranking to weight stops by route count
        app.state.stop_routes_cache = await GTFSService(
            session
        ).get_all_routes_at_stops()
    yield


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    return app


app = create_app()
