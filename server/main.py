from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.fastapi import BaseContext, GraphQLRouter

from server.config import db_url
from server import database
from server.database import (
    database_sanity_check,
    get_db,
    init_database,
)
from server.gql.resolver import Resolver
from server.gql.schema import schema
from server.services.gtfs_service import GTFSService


class GraphQLContext(BaseContext):
    def __init__(self, session: AsyncSession, stop_routes_cache: dict | None = None):
        self.session = session
        self.resolver = Resolver(session)
        self.stop_routes_cache = stop_routes_cache
        # Pre-derive route counts for use in get_near_by_stops ranking
        self.stop_route_counts = (
            {stop_id: len(routes) for stop_id, routes in stop_routes_cache.items()}
            if stop_routes_cache is not None
            else None
        )


async def get_context(
    request: Request, session: AsyncSession = Depends(get_db)
) -> GraphQLContext:
    cache = getattr(request.app.state, "stop_routes_cache", None)
    return GraphQLContext(session, cache)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if db_url is None:
        raise RuntimeError("Environment variable $DATABASE_URL was not set")
    init_database(db_url)
    async with database.AsyncSessionLocal() as session:
        await database_sanity_check(session)
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

    graphql_app = GraphQLRouter(
        schema, context_getter=get_context, graphql_ide="graphiql"
    )
    app.include_router(graphql_app, prefix="/graphql")

    return app


app = create_app()
