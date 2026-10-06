"""
Database layer integration tests.

Tests init_database() and database_sanity_check() against real SQLite
files built by the ETL loader.
"""

import sqlite3
from pathlib import Path

import pytest
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

import server.database as db_module
from server.database import (
    ALL_TABLES_SET,
    database_sanity_check,
    init_database,
)

_SCHEMA_SQL = Path(__file__).parent.parent / "etl" / "sql" / "schema.sql"

# ---------------------------------------------------------------------------
# init_database
# ---------------------------------------------------------------------------


def test_init_database_creates_engine(seeded_db_path):
    """init_database sets the module-level engine and session factory."""
    init_database(str(seeded_db_path))
    assert db_module.engine is not None
    assert db_module.AsyncSessionLocal is not None


def test_init_database_missing_file_raises(tmp_path):
    """A missing database file fails fast with a pointer to the build step."""
    with pytest.raises(RuntimeError, match="not found"):
        init_database(str(tmp_path / "missing.db"))


async def test_database_is_read_only(seeded_db_path):
    """The served database is opened read-only; writes are rejected."""
    init_database(str(seeded_db_path))
    async with db_module.AsyncSessionLocal() as session:
        with pytest.raises(OperationalError, match="readonly"):
            await session.execute(text("DELETE FROM routes"))


async def test_word_similarity_function_is_registered(seeded_db_path):
    """Search queries rely on the word_similarity SQL function."""
    init_database(str(seeded_db_path))
    async with db_module.AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT word_similarity('word', 'two words')")
        )
        assert result.scalar_one() == pytest.approx(0.8)


# ---------------------------------------------------------------------------
# database_sanity_check
# ---------------------------------------------------------------------------


async def test_database_sanity_check_passes(seeded_db_path):
    """sanity_check succeeds when all required GTFS tables are present."""
    init_database(str(seeded_db_path))
    async with db_module.AsyncSessionLocal() as session:
        # Should complete without raising
        await database_sanity_check(session)


async def test_database_sanity_check_fails_when_tables_missing(empty_db_path):
    """sanity_check raises RuntimeError when expected tables are absent."""
    init_database(str(empty_db_path))
    async with db_module.AsyncSessionLocal() as session:
        with pytest.raises(RuntimeError, match="missing"):
            await database_sanity_check(session)


def test_all_tables_set_matches_schema(tmp_path):
    """
    Every table in ALL_TABLES_SET exists after applying etl/sql/schema.sql.

    This catches drift between the Python constant and the schema.
    """
    conn = sqlite3.connect(tmp_path / "schema.db")
    conn.executescript(_SCHEMA_SQL.read_text())
    existing = {
        row[0]
        for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
    }
    conn.close()

    missing = ALL_TABLES_SET - existing
    assert not missing, f"Tables in ALL_TABLES_SET not found in schema: {missing}"
