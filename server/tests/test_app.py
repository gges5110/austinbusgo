import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

from server.main import create_app


def make_app(mocker):
    mocker.patch("server.main.db_path", "gtfs.db")
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


def test_api_routes_registered(mocker):
    app = make_app(mocker)
    routes = [r.path for r in app.routes]
    assert "/api/stops" in routes
    assert "/api/rt/vehicle-positions" in routes
    assert not any("/graphql" in r for r in routes)


def test_openapi_docs_respond(mocker):
    app = make_app(mocker)
    with TestClient(app) as client:
        response = client.get("/openapi.json")
        assert response.status_code == 200
        assert "/api/stops" in response.json()["paths"]


def test_create_app_no_db_path(mocker):
    mocker.patch("server.main.db_path", None)
    app = create_app()
    with pytest.raises(Exception):
        with TestClient(app):
            pass


def test_realtime_feed_errors_are_503_not_500():
    from fastapi.testclient import TestClient

    from server.main import create_app
    from server.services.gtfs_rt_client import RealtimeFeedError

    app = create_app()

    @app.get("/boom")
    async def boom():
        raise RealtimeFeedError("ConnectTimeout")

    response = TestClient(app).get("/boom")

    assert response.status_code == 503
    assert "ConnectTimeout" in response.json()["detail"]


def test_with_an_origin_secret_only_the_edge_cache_gets_in(mocker):
    mocker.patch("server.config.origin_secret", "s3cret")
    app = make_app(mocker)

    @app.get("/api/ping")
    async def ping():
        return {"ok": True}

    with TestClient(app) as client:
        assert client.get("/api/ping").status_code == 403
        assert (
            client.get("/api/ping", headers={"X-Origin-Auth": "wrong"}).status_code
            == 403
        )
        assert (
            client.get("/api/ping", headers={"X-Origin-Auth": "s3cret"}).status_code
            == 200
        )


def test_the_status_page_still_reaches_the_backend_directly(mocker):
    mocker.patch("server.config.origin_secret", "s3cret")
    app = make_app(mocker)

    with TestClient(app, raise_server_exceptions=False) as client:
        # Not 403: the route itself runs (its mocked database may fail)
        assert client.get("/api/rt/status").status_code != 403


def test_without_an_origin_secret_anyone_gets_in(mocker):
    mocker.patch("server.config.origin_secret", None)
    app = make_app(mocker)

    @app.get("/api/ping")
    async def ping():
        return {"ok": True}

    with TestClient(app) as client:
        assert client.get("/api/ping").status_code == 200
