import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from server.database import ALL_TABLES_SET, database_sanity_check


@pytest.mark.asyncio
async def test_database_sanity_check_success():
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.__iter__ = MagicMock(return_value=iter([(t,) for t in ALL_TABLES_SET]))
    mock_session.execute.return_value = mock_result

    await database_sanity_check(mock_session)

    mock_session.execute.assert_called_once()


@pytest.mark.asyncio
async def test_database_sanity_check_missing_tables():
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.__iter__ = MagicMock(return_value=iter([("trips",), ("routes",)]))
    mock_session.execute.return_value = mock_result

    with pytest.raises(RuntimeError, match="Some of the tables are missing"):
        await database_sanity_check(mock_session)


@pytest.mark.asyncio
async def test_database_sanity_check_connection_error():
    mock_session = AsyncMock()
    mock_session.execute.side_effect = Exception("Connection failed")

    with pytest.raises(Exception, match="Connection failed"):
        await database_sanity_check(mock_session)
