"""
Tests for application startup behaviour.

Covers:
- Happy-path startup with a valid GTFS_DB_PATH
- Missing GTFS_DB_PATH raises RuntimeError during lifespan
- A GTFS_DB_PATH pointing at a missing file fails startup
"""

import pytest
from starlette.testclient import TestClient

import server.main as main_module


def test_app_starts_with_valid_db(app_client):
    """Lifespan completes without errors when GTFS_DB_PATH points to a valid DB."""
    response = app_client.get("/openapi.json")
    assert response.status_code == 200


def test_missing_db_path_raises():
    """RuntimeError is raised during startup when GTFS_DB_PATH is not set."""
    original = main_module.db_path
    main_module.db_path = None
    try:
        app = main_module.create_app()
        with pytest.raises(RuntimeError, match="GTFS_DB_PATH"):
            with TestClient(app):
                pass
    finally:
        main_module.db_path = original


def test_nonexistent_db_file_raises(tmp_path):
    """Startup fails clearly when the database file has not been built."""
    original = main_module.db_path
    main_module.db_path = str(tmp_path / "missing.db")
    try:
        app = main_module.create_app()
        with pytest.raises(RuntimeError, match="not found"):
            with TestClient(app):
                pass
    finally:
        main_module.db_path = original
