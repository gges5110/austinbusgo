"""
Shared fixtures for integration tests.

Spins up a real PostGIS container (postgis/postgis:14-3.3, matching the
docker-compose setup) and initialises it with the GTFS schema from
etl/schema.sql so tests exercise the full database stack.
"""

from pathlib import Path

import psycopg2
import pytest
from starlette.testclient import TestClient
from testcontainers.postgres import PostgresContainer

import server.database as db_module
import server.main as main_module

_SCHEMA_SQL = (Path(__file__).parent.parent / "etl" / "schema.sql").read_text()


# ---------------------------------------------------------------------------
# Container fixtures (session-scoped – start once for the whole test run)
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def postgres_container():
    """Start a PostGIS container and keep it running for the entire session."""
    with PostgresContainer("postgis/postgis:14-3.3") as container:
        yield container


@pytest.fixture(scope="session")
def plain_db_url(postgres_container):
    """
    Return a plain postgresql://... URL (no SQLAlchemy driver prefix) that
    init_database() accepts.
    """
    return postgres_container.get_connection_url().replace("+psycopg2", "")


@pytest.fixture(scope="session")
def seeded_db_url(plain_db_url):
    """
    Same URL as plain_db_url but with all GTFS tables created from
    etl/schema.sql.  Used by tests that need the full schema.
    """
    conn = psycopg2.connect(plain_db_url)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(_SCHEMA_SQL)
    conn.close()
    return plain_db_url


@pytest.fixture(scope="session")
def empty_db_url(postgres_container, plain_db_url):
    """
    URL pointing to a freshly-created database with no tables.
    Used to verify that database_sanity_check raises when tables are absent.
    """
    conn = psycopg2.connect(plain_db_url)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("CREATE DATABASE test_empty")
    conn.close()
    base = plain_db_url.rsplit("/", 1)[0]
    return f"{base}/test_empty"


# ---------------------------------------------------------------------------
# App-level fixture
# ---------------------------------------------------------------------------


@pytest.fixture
def app_client(seeded_db_url):
    """
    A Starlette TestClient wired to the seeded test database.

    TestClient triggers the FastAPI lifespan (startup + shutdown), so this
    fixture exercises init_database and database_sanity_check against the
    real container.
    """
    main_module.db_url = seeded_db_url
    app = main_module.create_app()
    with TestClient(app) as client:
        yield client
    # Reset module-level engine state so other tests start clean
    db_module.engine = None
    db_module.AsyncSessionLocal = None
