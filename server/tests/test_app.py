import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

from server.main import create_app


def make_app(mocker):
    mocker.patch("server.main.db_url", "postgresql://user:pass@localhost/db")
    mocker.patch("server.main.init_database")
    mocker.patch("server.main.database_sanity_check", new=AsyncMock())
    # Mock the session factory used both in lifespan and get_db
    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=False)
    mocker.patch("server.database.AsyncSessionLocal", return_value=mock_session)
    # Mock GTFSService so the startup cache load does not require a real DB
    mock_gtfs = MagicMock()
    mock_gtfs.get_all_routes_at_stops = AsyncMock(return_value={})
    mocker.patch("server.main.GTFSService", return_value=mock_gtfs)
    return create_app()


def test_create_app_returns_fastapi(mocker):
    app = make_app(mocker)
    assert isinstance(app, FastAPI)


def test_graphql_route_registered(mocker):
    app = make_app(mocker)
    routes = [r.path for r in app.routes]
    assert any("/graphql" in r for r in routes)


def test_graphql_endpoint_responds(mocker):
    app = make_app(mocker)
    with TestClient(app) as client:
        response = client.get("/graphql")
        assert response.status_code == 200


def test_create_app_no_db_url(mocker):
    mocker.patch("server.main.db_url", None)
    app = create_app()
    with pytest.raises(Exception):
        with TestClient(app):
            pass
