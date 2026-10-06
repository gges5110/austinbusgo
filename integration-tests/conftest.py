"""
Shared fixtures for integration tests.

Builds real SQLite GTFS databases with the production loader
(etl/build_db.py) from small GTFS CSV fixtures, so tests exercise the full
ETL → database → API stack.
"""

import csv
import sqlite3
import sys
from pathlib import Path

import pytest
from starlette.testclient import TestClient

import server.database as db_module
import server.main as main_module

sys.path.insert(0, str(Path(__file__).parent.parent / "etl"))
from build_db import build_database  # noqa: E402

# ---------------------------------------------------------------------------
# GTFS CSV fixtures
# ---------------------------------------------------------------------------

# Columns of each GTFS file; every file is written even when it has no rows
_GTFS_COLUMNS = {
    "agency": ["agency_id", "agency_name", "agency_url", "agency_timezone"],
    "feed_info": [
        "feed_publisher_name",
        "feed_publisher_url",
        "feed_lang",
        "feed_start_date",
        "feed_end_date",
        "feed_version",
    ],
    "routes": [
        "route_id",
        "route_short_name",
        "route_long_name",
        "route_type",
        "route_color",
        "route_text_color",
    ],
    "stops": ["stop_id", "stop_code", "stop_name", "stop_lat", "stop_lon"],
    "shapes": ["shape_id", "shape_pt_lat", "shape_pt_lon", "shape_pt_sequence"],
    "trips": [
        "route_id",
        "service_id",
        "trip_id",
        "trip_headsign",
        "direction_id",
        "shape_id",
        "trip_short_name",
    ],
    "stop_times": [
        "trip_id",
        "arrival_time",
        "departure_time",
        "stop_id",
        "stop_sequence",
    ],
    "calendar_dates": ["service_id", "date", "exception_type"],
    "transfers": ["from_stop_id", "to_stop_id", "transfer_type", "min_transfer_time"],
}

# The empty-schema database still needs the single feed_info row
_FEED_INFO = [
    ["CapMetro Test", "https://capmetro.org", "en", "20260101", "20261231", "test-v1"]
]

_SEED_ROWS = {
    "agency": [["CM", "Capital Metro", "https://capmetro.org", "America/Chicago"]],
    "feed_info": _FEED_INFO,
    "routes": [["10", "10", "Congress Avenue", "3", "FF0000", "FFFFFF"]],
    "stops": [
        ["stop-1", "1001", "Congress & 1st", "30.26715", "-97.74306"],
        ["stop-2", "1002", "Congress & 2nd", "30.26800", "-97.74310"],
    ],
    "shapes": [
        ["shp-1", "30.26715", "-97.74306", "1"],
        ["shp-1", "30.26800", "-97.74310", "2"],
    ],
    "trips": [
        ["10", "svc-1", "trip-1", "Downtown", "0", "shp-1", "T1"],
        # Runs past midnight on the 2026-02-24 service day
        ["10", "svc-1", "trip-2", "Downtown", "0", "shp-1", "T2"],
    ],
    "stop_times": [
        ["trip-1", "23:50:00", "23:50:00", "stop-1", "1"],
        ["trip-1", "23:59:00", "23:59:00", "stop-2", "2"],
        ["trip-2", "24:10:00", "24:10:00", "stop-1", "1"],
        ["trip-2", "24:12:00", "24:12:00", "stop-2", "2"],
    ],
    "calendar_dates": [["svc-1", "20260224", "1"]],
}


def _build(tmp_dir: Path, rows_by_file: dict) -> Path:
    csv_dir = tmp_dir / "csv"
    csv_dir.mkdir()
    for name, columns in _GTFS_COLUMNS.items():
        with open(csv_dir / f"{name}.txt", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(columns)
            writer.writerows(rows_by_file.get(name, []))
    return build_database(csv_dir=csv_dir, db_path=tmp_dir / "gtfs.db")


@pytest.fixture(scope="session")
def seeded_db_path(tmp_path_factory):
    """A database with the full GTFS schema but (almost) no data."""
    return _build(tmp_path_factory.mktemp("schema"), {"feed_info": _FEED_INFO})


@pytest.fixture(scope="session")
def seeded_data_db_path(tmp_path_factory):
    """
    A database built from a small but representative set of GTFS rows.
    Tests that need real rows to assert against should use this fixture
    (or data_app_client below).
    """
    return _build(tmp_path_factory.mktemp("data"), _SEED_ROWS)


@pytest.fixture(scope="session")
def empty_db_path(tmp_path_factory):
    """
    A SQLite file with no tables. Used to verify that
    database_sanity_check raises when tables are absent.
    """
    path = tmp_path_factory.mktemp("empty") / "empty.db"
    sqlite3.connect(path).close()
    return path


# ---------------------------------------------------------------------------
# App-level fixtures
# ---------------------------------------------------------------------------


def _client(db_path):
    main_module.db_path = str(db_path)
    app = main_module.create_app()
    with TestClient(app) as client:
        yield client
    # Reset module-level engine state so other tests start clean
    db_module.engine = None
    db_module.AsyncSessionLocal = None


@pytest.fixture
def data_app_client(seeded_data_db_path):
    """
    A Starlette TestClient wired to the seeded-data test database.

    Use this fixture when tests need to assert actual query results rather
    than just verifying that queries return empty lists.
    """
    yield from _client(seeded_data_db_path)


@pytest.fixture
def app_client(seeded_db_path):
    """
    A Starlette TestClient wired to the schema-only test database.

    TestClient triggers the FastAPI lifespan (startup + shutdown), so this
    fixture exercises init_database and database_sanity_check against a
    real database file.
    """
    yield from _client(seeded_db_path)
