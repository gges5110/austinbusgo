"""REST API routers, combined under /api."""

from fastapi import APIRouter

from server.api.routers.feed import router as feed_router
from server.api.routers.real_time import router as real_time_router
from server.api.routers.routes import router as routes_router
from server.api.routers.search import router as search_router
from server.api.routers.stops import router as stops_router
from server.api.routers.trips import router as trips_router

api_router = APIRouter(prefix="/api")
api_router.include_router(stops_router)
api_router.include_router(routes_router)
api_router.include_router(trips_router)
api_router.include_router(search_router)
api_router.include_router(real_time_router)
api_router.include_router(feed_router)
