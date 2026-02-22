from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
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


class GraphQLContext(BaseContext):
    def __init__(self, session: AsyncSession):
        self.session = session
        self.resolver = Resolver(session)


async def get_context(session: AsyncSession = Depends(get_db)) -> GraphQLContext:
    return GraphQLContext(session)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if db_url is None:
        raise RuntimeError("Environment variable $DATABASE_URL was not set")
    init_database(db_url)
    async with database.AsyncSessionLocal() as session:
        await database_sanity_check(session)
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
