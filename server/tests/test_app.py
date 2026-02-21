import pytest
from flask import Flask
from server.app import create_app


def test_create_app(mocker):
    # Mock dependencies to avoid real side effects
    mocker.patch("server.app.database_sanity_check")
    mocker.patch("server.app.db_wrapper.init_app")
    mocker.patch("server.app.db_url", "postgresql://user:pass@localhost/db")

    app = create_app()

    assert isinstance(app, Flask)
    assert app.name == "server.app"
    # Check if GraphQL route is registered
    rules = [rule.rule for rule in app.url_map.iter_rules()]
    assert "/graphql" in rules


def test_create_app_debug(mocker):
    mocker.patch("server.app.database_sanity_check")
    mocker.patch("server.app.db_wrapper.init_app")
    mocker.patch("server.app.db_url", "postgresql://user:pass@localhost/db")

    # Patch Flask's __init__ or just the return value to set debug=True
    mock_app = Flask("server.app")
    mock_app.debug = True
    mocker.patch("server.app.Flask", return_value=mock_app)

    mock_logging = mocker.patch("server.app.logging.getLogger")

    create_app()

    mock_logging.assert_called_with("peewee")


def test_create_app_no_db_url(mocker):
    mocker.patch("server.app.db_url", None)

    with pytest.raises(
        RuntimeError, match="Environment variable \$DATABASE_URL was not set"
    ):
        create_app()
