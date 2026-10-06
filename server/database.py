from pathlib import Path

from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from server.services.text_similarity import word_similarity

ALL_TABLES_SET = {
    "trips",
    "routes",
    "shapes_aggregated",
    "stop_times",
    "stops",
    "calendar_dates",
    "agency",
    "transfers",
    "feed_info",
    "routes_at_stop",
}

engine = None
AsyncSessionLocal = None


class Base(DeclarativeBase):
    pass


def init_database(db_path: str) -> None:
    """Open the GTFS SQLite file built by etl/build_db.py, read-only.

    `immutable=1` tells SQLite the file never changes while open, which
    skips file locking entirely; the database is rebuilt and redeployed as
    a whole rather than written to.
    """
    global engine, AsyncSessionLocal
    path = Path(db_path).resolve()
    if not path.is_file():
        raise RuntimeError(
            f"GTFS database not found at {path}; build it with `make update-db`"
        )
    engine = create_async_engine(
        f"sqlite+aiosqlite:///file:{path}?mode=ro&immutable=1&uri=true"
    )

    @event.listens_for(engine.sync_engine, "connect")
    def _register_functions(dbapi_connection, _connection_record):
        dbapi_connection.run_async(
            lambda conn: conn.create_function(
                "word_similarity", 2, word_similarity, deterministic=True
            )
        )

    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def database_sanity_check(session: AsyncSession) -> None:
    from sqlalchemy import text

    result = await session.execute(
        text("SELECT name FROM sqlite_master WHERE type = 'table'")
    )
    tables_set = {row[0] for row in result}
    missing = ALL_TABLES_SET.difference(tables_set)
    if missing:
        raise RuntimeError(f"Some of the tables are missing: {missing}")
