"""
Tests for application startup behaviour.

Covers:
- Happy-path startup with a valid DATABASE_URL
- Missing DATABASE_URL raises RuntimeError during lifespan
- Regression: ?sslmode=require in DATABASE_URL must not raise
  TypeError: connect() got an unexpected keyword argument 'sslmode'
"""

import pytest
from starlette.testclient import TestClient

import server.database as db_module
import server.main as main_module
from server.database import init_database


def test_app_starts_with_valid_db(app_client):
    """Lifespan completes without errors when DATABASE_URL points to a valid DB."""
    response = app_client.post("/graphql", json={"query": "{ __typename }"})
    assert response.status_code == 200


def test_missing_database_url_raises():
    """RuntimeError is raised during startup when DATABASE_URL is not set."""
    original = main_module.db_url
    main_module.db_url = None
    try:
        app = main_module.create_app()
        with pytest.raises(RuntimeError, match="DATABASE_URL"):
            with TestClient(app):
                pass
    finally:
        main_module.db_url = original


def test_sslmode_url_does_not_raise_type_error():
    """
    Regression test for the Cloud Run startup crash.

    Before the fix, DATABASE_URL containing ?sslmode=require caused asyncpg
    to raise:
        TypeError: connect() got an unexpected keyword argument 'sslmode'

    init_database() must parse the URL correctly and produce an engine whose
    URL no longer contains 'sslmode'.
    """
    url_with_sslmode = "postgresql://user:pass@localhost:9999/db?sslmode=require"

    # Engine creation is lazy – no actual connection is attempted here, so we
    # can use a non-existent host to isolate URL-parsing from connectivity.
    init_database(url_with_sslmode)

    assert db_module.engine is not None
    assert "sslmode" not in str(db_module.engine.url)
    assert "sslmode" not in str(db_module.engine.url.query)
