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
# Seeded-data fixtures (schema + representative GTFS rows)
# ---------------------------------------------------------------------------

_SEED_SQL = """
INSERT INTO feed_info
    (feed_publisher_name, feed_publisher_url, feed_lang,
     feed_start_date, feed_end_date, feed_version)
VALUES
    ('CapMetro Test', 'https://capmetro.org', 'en',
     '2026-01-01', '2026-12-31', 'test-v1');

INSERT INTO routes
    (route_id, route_short_name, route_long_name,
     route_type, route_color, route_text_color)
VALUES
    ('10', '10', 'Congress Avenue', 3, 'FF0000', 'FFFFFF');

INSERT INTO stops (stop_id, stop_code, stop_name, stop_loc)
VALUES
    ('stop-1', '1001', 'Congress & 1st',
     ST_GeographyFromText('SRID=4326;POINT(-97.74306 30.26715)')),
    ('stop-2', '1002', 'Congress & 2nd',
     ST_GeographyFromText('SRID=4326;POINT(-97.74310 30.26800)'));

INSERT INTO shapes (shape_id, shape_pt_loc, shape_pt_sequence)
VALUES
    ('shp-1',
     ST_GeographyFromText('SRID=4326;POINT(-97.74306 30.26715)'), 1),
    ('shp-1',
     ST_GeographyFromText('SRID=4326;POINT(-97.74310 30.26800)'), 2);

INSERT INTO trips
    (trip_id, route_id, service_id, trip_headsign,
     direction_id, shape_id, trip_short_name)
VALUES
    ('trip-1', '10', 'svc-1', 'Downtown', 0, 'shp-1', 'T1');

INSERT INTO calendar_dates (service_id, date, exception_type)
VALUES ('svc-1', '2026-02-24', 1);

INSERT INTO stop_times
    (trip_id, arrival_time, departure_time, stop_id, stop_sequence)
VALUES
    ('trip-1', '23:50:00', '23:50:00', 'stop-1', 1),
    ('trip-1', '23:59:00', '23:59:00', 'stop-2', 2);

REFRESH MATERIALIZED VIEW shapes_aggregated;
REFRESH MATERIALIZED VIEW routes_at_stop;
"""


@pytest.fixture(scope="session")
def seeded_data_db_url(postgres_container, plain_db_url):
    """
    URL pointing to a separate database populated with the GTFS schema and a
    small but representative set of seed data.  Tests that need real rows to
    assert against should use this fixture (or data_app_client below).
    """
    conn = psycopg2.connect(plain_db_url)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("CREATE DATABASE test_data")
    conn.close()

    base = plain_db_url.rsplit("/", 1)[0]
    data_url = f"{base}/test_data"

    conn = psycopg2.connect(data_url)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(_SCHEMA_SQL)
        cur.execute(_SEED_SQL)
    conn.close()
    return data_url


# ---------------------------------------------------------------------------
# App-level fixture
# ---------------------------------------------------------------------------


@pytest.fixture
def data_app_client(seeded_data_db_url):
    """
    A Starlette TestClient wired to the seeded-data test database.

    Use this fixture when tests need to assert actual query results rather
    than just verifying that queries return empty lists.
    """
    main_module.db_url = seeded_data_db_url
    app = main_module.create_app()
    with TestClient(app) as client:
        yield client
    db_module.engine = None
    db_module.AsyncSessionLocal = None


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
