"""
Database layer integration tests.

Tests init_database() and database_sanity_check() against a real
PostgreSQL/PostGIS container.

Key regression covered:
  init_database() with a ?sslmode=require URL must not raise
  TypeError: connect() got an unexpected keyword argument 'sslmode'
"""

import pytest

import server.database as db_module
from server.database import (
    ALL_TABLES_SET,
    database_sanity_check,
    init_database,
)


# ---------------------------------------------------------------------------
# init_database
# ---------------------------------------------------------------------------


def test_init_database_creates_engine(plain_db_url):
    """init_database sets the module-level engine and session factory."""
    init_database(plain_db_url)
    assert db_module.engine is not None
    assert db_module.AsyncSessionLocal is not None


def test_init_database_strips_sslmode_regression():
    """
    Regression: ?sslmode=require must be removed from the URL before asyncpg
    sees it, and ssl=True must be passed via connect_args instead.

    A real host is not required because create_async_engine is lazy –
    the connection is only opened on first use.
    """
    init_database("postgresql://user:pass@localhost:9999/db?sslmode=require")

    url_str = str(db_module.engine.url)
    assert "sslmode" not in url_str
    assert "sslmode" not in str(db_module.engine.url.query)


# ---------------------------------------------------------------------------
# database_sanity_check
# ---------------------------------------------------------------------------


async def test_database_sanity_check_passes(seeded_db_url):
    """sanity_check succeeds when all required GTFS tables are present."""
    init_database(seeded_db_url)
    async with db_module.AsyncSessionLocal() as session:
        # Should complete without raising
        await database_sanity_check(session)


async def test_database_sanity_check_fails_when_tables_missing(empty_db_url):
    """
    sanity_check raises RuntimeError when expected tables are absent.

    Uses a fresh database (no schema applied) in the same container.
    """
    init_database(empty_db_url)
    async with db_module.AsyncSessionLocal() as session:
        with pytest.raises(RuntimeError, match="missing"):
            await database_sanity_check(session)


async def test_all_tables_set_matches_schema(seeded_db_url):
    """
    Every table in ALL_TABLES_SET exists in the database after schema init.

    This catches drift between the Python constant and etl/schema.sql.
    """
    from sqlalchemy import text

    init_database(seeded_db_url)
    async with db_module.AsyncSessionLocal() as session:
        result = await session.execute(
            text(
                "SELECT table_name FROM information_schema.tables"
                " WHERE table_schema = 'public'"
            )
        )
        existing = {row[0] for row in result}

    missing = ALL_TABLES_SET - existing
    assert not missing, f"Tables in ALL_TABLES_SET not found in schema: {missing}"
