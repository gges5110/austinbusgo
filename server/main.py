from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import BaseContext, GraphQLRouter

from server.config import db_url
from server.database import database, database_sanity_check
from server.gql.resolver import Resolver
from server.gql.schema import schema


class GraphQLContext(BaseContext):
    def __init__(self):
        self.resolver = Resolver()


async def get_context() -> GraphQLContext:
    return GraphQLContext()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if db_url is None:
        raise RuntimeError("Environment variable $DATABASE_URL was not set")
    database.init(db_url)
    database_sanity_check()
    yield


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def db_connection_middleware(request: Request, call_next):
        database.connect(reuse_if_open=True)
        try:
            response = await call_next(request)
        finally:
            if not database.is_closed():
                database.close()
        return response

    graphql_app = GraphQLRouter(
        schema, context_getter=get_context, graphql_ide="graphiql"
    )
    app.include_router(graphql_app, prefix="/graphql")

    return app


app = create_app()
