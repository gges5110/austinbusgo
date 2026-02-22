import pytest
from server.database import database_sanity_check, ALL_TABLES_SET


def test_database_sanity_check_success(mocker):
    mock_db = mocker.patch("server.database.database")
    mock_db.connect.return_value = None
    mock_db.get_tables.return_value = list(ALL_TABLES_SET)
    mock_db.is_closed.return_value = False

    database_sanity_check()

    mock_db.connect.assert_called_once()
    mock_db.get_tables.assert_called_once()
    mock_db.close.assert_called_once()


def test_database_sanity_check_missing_tables(mocker):
    mock_db = mocker.patch("server.database.database")
    mock_db.connect.return_value = None
    mock_db.get_tables.return_value = ["trips", "routes"]  # Missing others
    mock_db.is_closed.return_value = False

    with pytest.raises(RuntimeError, match="Some of the tables are missing"):
        database_sanity_check()

    mock_db.close.assert_called_once()


def test_database_sanity_check_connection_error(mocker):
    mock_db = mocker.patch("server.database.database")
    mock_db.connect.side_effect = Exception("Connection failed")
    mock_db.is_closed.return_value = True

    with pytest.raises(Exception, match="Connection failed"):
        database_sanity_check()
