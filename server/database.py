from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

ALL_TABLES_SET = {
    "trips",
    "routes",
    "shapes",
    "stop_times",
    "stops",
    "calendar_dates",
    "agency",
    "transfers",
}

engine = None
AsyncSessionLocal = None


class Base(DeclarativeBase):
    pass


def init_database(db_url: str) -> None:
    global engine, AsyncSessionLocal
    async_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(async_url, pool_size=5, max_overflow=10)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def database_sanity_check(session: AsyncSession) -> None:
    from sqlalchemy import text

    result = await session.execute(
        text(
            "SELECT table_name FROM information_schema.tables"
            " WHERE table_schema = 'public'"
        )
    )
    tables_set = {row[0] for row in result}
    missing = ALL_TABLES_SET.difference(tables_set)
    if missing:
        raise RuntimeError(f"Some of the tables are missing: {missing}")
