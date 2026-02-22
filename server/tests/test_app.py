import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from server.main import create_app


def test_create_app_returns_fastapi(mocker):
    mocker.patch("server.main.db_url", "postgresql://user:pass@localhost/db")
    mocker.patch("server.main.database.init")
    mocker.patch("server.main.database_sanity_check")
    mocker.patch("server.main.database.connect")
    mocker.patch("server.main.database.is_closed", return_value=True)

    app = create_app()
    assert isinstance(app, FastAPI)


def test_graphql_route_registered(mocker):
    mocker.patch("server.main.db_url", "postgresql://user:pass@localhost/db")
    mocker.patch("server.main.database.init")
    mocker.patch("server.main.database_sanity_check")
    mocker.patch("server.main.database.connect")
    mocker.patch("server.main.database.is_closed", return_value=True)

    app = create_app()
    routes = [r.path for r in app.routes]
    assert any("/graphql" in r for r in routes)


def test_graphql_endpoint_responds(mocker):
    mocker.patch("server.main.db_url", "postgresql://user:pass@localhost/db")
    mocker.patch("server.main.database.init")
    mocker.patch("server.main.database_sanity_check")
    mocker.patch("server.main.database.connect")
    mocker.patch("server.main.database.is_closed", return_value=True)

    app = create_app()
    with TestClient(app) as client:
        response = client.get("/graphql")
        assert response.status_code == 200


def test_create_app_no_db_url(mocker):
    mocker.patch("server.main.db_url", None)

    app = create_app()
    with pytest.raises(Exception):
        with TestClient(app):
            pass
