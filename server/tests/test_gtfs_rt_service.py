import pytest
from sqlalchemy.exc import NoResultFound
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate
from typing import List

from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_service import GTFSService


def make_service():
    mock_gtfs_service = AsyncMock(spec=GTFSService)
    mock_gtfs_rt_client = MagicMock()
    svc = GTFSRTService(mock_gtfs_service, mock_gtfs_rt_client)
    return svc, mock_gtfs_service, mock_gtfs_rt_client


def create_trip_update(trip_id: str, route_id: str = "") -> TripUpdate:
    tu = TripUpdate()
    tu.trip.trip_id = trip_id
    tu.trip.route_id = route_id
    return tu


def create_stop_time_update(stop_id: str) -> TripUpdate.StopTimeUpdate:
    stu = TripUpdate.StopTimeUpdate()
    stu.stop_id = stop_id
    return stu


@pytest.mark.asyncio
async def test_get_real_time_vehicle_positions_on_route():
    svc, mock_gtfs, mock_client = make_service()

    vp1 = VehiclePosition()
    vp1.trip.trip_id = "trip_1"
    vp2 = VehiclePosition()
    vp2.trip.trip_id = "trip_2"
    mock_client.load_vehicle_positions.return_value = [vp1, vp2]
    mock_gtfs.get_trips_with_direction_and_route.return_value = ["trip_2"]

    result = await svc.get_real_time_vehicle_positions_on_route("route_1", 0)

    assert len(result) == 1
    assert result[0].trip.trip_id == "trip_2"


def test_get_real_time_vehicle_positions():
    svc, _, mock_client = make_service()
    vp = VehiclePosition()
    mock_client.load_vehicle_positions.return_value = [vp]

    result = svc.get_real_time_vehicle_positions()

    assert len(result) == 1
    mock_client.load_vehicle_positions.assert_called_with()


def test_get_real_time_trip_updates():
    svc, _, mock_client = make_service()
    mock_client.load_trip_updates.return_value = [
        create_trip_update("trip_1"),
        create_trip_update("trip_2"),
        create_trip_update("trip_3"),
    ]

    result = svc.get_real_time_trip_updates(["trip_1", "trip_2"])

    assert len(result) == 2


def test_get_all_real_time_trip_updates_by_trip_id():
    svc, _, mock_client = make_service()
    mock_client.load_trip_updates.return_value = [
        create_trip_update("trip_1"),
        create_trip_update("trip_2"),
    ]

    result = svc.get_all_real_time_trip_updates(trip_id="trip_1")

    assert len(result) == 1
    assert result[0].trip.trip_id == "trip_1"


def test_get_all_real_time_trip_updates_by_route_id():
    svc, _, mock_client = make_service()
    mock_client.load_trip_updates.return_value = [
        create_trip_update("trip_1", "route_1"),
        create_trip_update("trip_2", "route_2"),
    ]

    result = svc.get_all_real_time_trip_updates(route_id="route_1")

    assert len(result) == 1
    assert result[0].trip.route_id == "route_1"


def test_get_all_real_time_trip_updates_none_filter():
    svc, _, mock_client = make_service()
    mock_client.load_trip_updates.return_value = [create_trip_update("trip_1")]

    result = svc.get_all_real_time_trip_updates()

    assert len(result) == 1


@pytest.mark.asyncio
async def test_get_real_time_trip_updates_on_route():
    svc, mock_gtfs, mock_client = make_service()
    tu = create_trip_update("trip_1", "route_1")
    mock_client.load_trip_updates.return_value = [tu]
    mock_gtfs.get_trip_by_id.return_value = SimpleNamespace(direction_id=0)

    result = await svc.get_real_time_trip_updates_on_route("route_1", 0)

    assert len(result) == 1


@pytest.mark.asyncio
async def test_get_real_time_trip_updates_on_route_skips_unknown_trips():
    """Live-feed trips missing from the static GTFS are skipped, not fatal."""
    svc, mock_gtfs, mock_client = make_service()
    known = create_trip_update("trip_known", "route_1")
    unknown = create_trip_update("trip_unknown", "route_1")
    mock_client.load_trip_updates.return_value = [unknown, known]
    mock_gtfs.get_trip_by_id.side_effect = [
        NoResultFound(),
        SimpleNamespace(direction_id=0),
    ]

    result = await svc.get_real_time_trip_updates_on_route("route_1", 0)

    assert len(result) == 1
    assert result[0].trip.trip_id == "trip_known"


@pytest.mark.asyncio
async def test_get_real_time_trip_updates_on_route_wrong_direction():
    svc, mock_gtfs, mock_client = make_service()
    tu = create_trip_update("trip_1", "route_1")
    mock_client.load_trip_updates.return_value = [tu]
    mock_gtfs.get_trip_by_id.return_value = SimpleNamespace(direction_id=1)

    result = await svc.get_real_time_trip_updates_on_route("route_1", 0)

    assert len(result) == 0


def test_get_arrival_time_by_stop_id():
    svc, _, _ = make_service()
    stus = [
        create_stop_time_update("stop_1"),
        create_stop_time_update("stop_2"),
    ]

    result = svc.get_arrival_time_by_stop_id(stus, "stop_2")

    assert result is not None
    assert result.stop_id == "stop_2"


def test_get_arrival_time_by_stop_id_not_found():
    svc, _, _ = make_service()
    stus = [create_stop_time_update("stop_1")]

    result = svc.get_arrival_time_by_stop_id(stus, "stop_99")

    assert result is None


def test_get_real_time_trip_updates_no_match():
    svc, _, mock_client = make_service()
    mock_client.load_trip_updates.return_value = [
        create_trip_update("trip_1"),
        create_trip_update("trip_2"),
        create_trip_update("trip_3"),
    ]

    result = svc.get_real_time_trip_updates(["trip_1", "trip_2", "trip_3"])

    assert len(result) == 3
