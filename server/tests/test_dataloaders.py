"""Tests for GraphQL dataloaders."""

import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

from server.gql.dataloaders import (
    create_dataloaders,
    batch_load_routes_by_stop_id,
    batch_load_route_by_id,
    batch_load_stop_times_by_trip_id,
)
from server.services.gtfs_service import GTFSService


@pytest.mark.asyncio
async def test_batch_load_routes_by_stop_id():
    """Test loading routes for multiple stops in a single batch."""
    gtfs_service = AsyncMock(spec=GTFSService)

    # Mock routes for each stop
    route1 = SimpleNamespace(route_id="1", route_long_name="Route 1")
    route2 = SimpleNamespace(route_id="2", route_long_name="Route 2")
    route3 = SimpleNamespace(route_id="3", route_long_name="Route 3")

    gtfs_service.get_routes_at_stops.return_value = {
        "stop_1": [route1, route2],
        "stop_2": [route2, route3],
        "stop_3": [],
    }

    result = await batch_load_routes_by_stop_id(
        ["stop_1", "stop_2", "stop_3"], gtfs_service
    )

    # Verify results are in correct order
    assert len(result) == 3
    assert result[0] == [route1, route2]
    assert result[1] == [route2, route3]
    assert result[2] == []

    # Verify the whole batch went to the database as one call
    gtfs_service.get_routes_at_stops.assert_called_once_with(
        ["stop_1", "stop_2", "stop_3"]
    )


@pytest.mark.asyncio
async def test_batch_load_route_by_id():
    """Test loading routes by ID in a single batch."""
    gtfs_service = AsyncMock(spec=GTFSService)

    # Mock all routes
    route1 = SimpleNamespace(route_id="1", route_long_name="Route 1")
    route2 = SimpleNamespace(route_id="2", route_long_name="Route 2")
    route3 = SimpleNamespace(route_id="3", route_long_name="Route 3")

    gtfs_service.get_routes.return_value = [route1, route2, route3]

    result = await batch_load_route_by_id(["1", "2", "999"], gtfs_service)

    # Verify results are in correct order
    assert len(result) == 3
    assert result[0] == route1
    assert result[1] == route2
    assert result[2] is None  # Non-existent route

    # Verify service was called only once
    gtfs_service.get_routes.assert_called_once()


def test_create_dataloaders():
    """Test dataloader factory creates all dataloaders."""
    gtfs_service = MagicMock(spec=GTFSService)

    dataloaders = create_dataloaders(gtfs_service)

    # Verify all dataloaders are created
    assert "routes_by_stop" in dataloaders
    assert "route_by_id" in dataloaders
    assert "stop_times_by_trip" in dataloaders
    assert len(dataloaders) == 3


@pytest.mark.asyncio
async def test_routes_by_stop_dataloader_batching():
    """Test that routes_by_stop dataloader batches requests when awaited together."""
    import asyncio

    gtfs_service = AsyncMock(spec=GTFSService)
    route1 = SimpleNamespace(route_id="1", route_long_name="Route 1")

    gtfs_service.get_routes_at_stops.return_value = {
        "stop_1": [route1],
        "stop_2": [route1],
    }

    dataloaders = create_dataloaders(gtfs_service)
    routes_loader = dataloaders["routes_by_stop"]

    # Load routes for two stops together for batching
    result1, result2 = await asyncio.gather(
        routes_loader.load("stop_1"), routes_loader.load("stop_2")
    )

    # Both should be loaded in single batch
    assert result1 == [route1]
    assert result2 == [route1]
    # Both stops batched into a single database round trip
    gtfs_service.get_routes_at_stops.assert_called_once()


@pytest.mark.asyncio
async def test_route_by_id_dataloader_batching():
    """Test that route_by_id dataloader batches requests when awaited together."""
    import asyncio

    gtfs_service = AsyncMock(spec=GTFSService)
    route1 = SimpleNamespace(route_id="1", route_long_name="Route 1")
    route2 = SimpleNamespace(route_id="2", route_long_name="Route 2")

    gtfs_service.get_routes.return_value = [route1, route2]

    dataloaders = create_dataloaders(gtfs_service)
    route_loader = dataloaders["route_by_id"]

    # Load routes by ID together for batching
    result1, result2 = await asyncio.gather(
        route_loader.load("1"), route_loader.load("2")
    )

    assert result1 == route1
    assert result2 == route2
    # All routes loaded in single call when batched together
    gtfs_service.get_routes.assert_called_once()


@pytest.mark.asyncio
async def test_batch_load_stop_times_by_trip_id():
    """Test loading stop times for multiple trips in a single batch."""
    gtfs_service = AsyncMock(spec=GTFSService)

    # Mock stop times for each trip
    stop_time1 = SimpleNamespace(
        trip_id="trip_1", stop_id="stop_1", arrival_time="10:00:00"
    )
    stop_time2 = SimpleNamespace(
        trip_id="trip_1", stop_id="stop_2", arrival_time="10:05:00"
    )
    stop_time3 = SimpleNamespace(
        trip_id="trip_2", stop_id="stop_3", arrival_time="10:10:00"
    )

    gtfs_service.get_stop_times_by_trip_id.side_effect = [
        [stop_time1, stop_time2],  # Stop times for trip_1
        [stop_time3],  # Stop times for trip_2
        [],  # Stop times for trip_3
    ]

    result = await batch_load_stop_times_by_trip_id(
        ["trip_1", "trip_2", "trip_3"], gtfs_service
    )

    # Verify results are in correct order
    assert len(result) == 3
    assert result[0] == [stop_time1, stop_time2]
    assert result[1] == [stop_time3]
    assert result[2] == []

    # Verify service was called for each trip
    assert gtfs_service.get_stop_times_by_trip_id.call_count == 3


@pytest.mark.asyncio
async def test_stop_times_by_trip_dataloader_batching():
    """Test that stop_times_by_trip dataloader batches requests."""
    import asyncio

    gtfs_service = AsyncMock(spec=GTFSService)
    stop_time1 = SimpleNamespace(
        trip_id="trip_1", stop_id="stop_1", arrival_time="10:00:00"
    )
    stop_time2 = SimpleNamespace(
        trip_id="trip_2", stop_id="stop_2", arrival_time="10:05:00"
    )

    gtfs_service.get_stop_times_by_trip_id.side_effect = [[stop_time1], [stop_time2]]

    dataloaders = create_dataloaders(gtfs_service)
    stop_times_loader = dataloaders["stop_times_by_trip"]

    # Load stop times for two trips together for batching
    result1, result2 = await asyncio.gather(
        stop_times_loader.load("trip_1"), stop_times_loader.load("trip_2")
    )

    # Both should be loaded
    assert result1 == [stop_time1]
    assert result2 == [stop_time2]
    # Called once per trip in batch
    assert gtfs_service.get_stop_times_by_trip_id.call_count == 2
