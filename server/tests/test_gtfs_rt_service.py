import pytest
from unittest.mock import MagicMock
from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate
from typing import List

mock_trip_updates_pb_file_url = "http://url1"
mock_vehicle_positions_pb_file_url = "http://url2"


def create_trip_update(trip_id: str) -> TripUpdate:
    trip_update = TripUpdate()
    trip_update.trip.trip_id = trip_id
    return trip_update


def create_stop_time_update(stop_id: str) -> TripUpdate.StopTimeUpdate:
    stop_time_update = TripUpdate.StopTimeUpdate()
    stop_time_update.stop_id = stop_id
    return stop_time_update


def test_get_real_time_vehicle_positions(gtfs_rt_service, mocker):
    mocker.patch(
        "server.services.gtfs_service.GTFSService.get_trips_with_direction_and_route",
        return_value=["trip_2"],
    )

    vehicle_position = VehiclePosition()
    vehicle_position.trip.trip_id = "trip_1"

    vehicle_position2 = VehiclePosition()
    vehicle_position2.trip.trip_id = "trip_2"

    gtfs_rt_service.gtfs_rt_client.load_vehicle_positions.return_value = [
        vehicle_position,
        vehicle_position2,
    ]

    vehicle_positions = gtfs_rt_service.get_real_time_vehicle_positions_on_route(
        "3", True
    )

    assert len(vehicle_positions) == 1
    assert vehicle_positions[0].trip.trip_id == "trip_2"


def test_get_real_time_trip_updates(gtfs_rt_service, mocker):
    trip_ids = ["trip_1", "trip_2"]
    gtfs_rt_service.gtfs_rt_client.load_trip_updates.return_value = [
        create_trip_update("trip_1"),
        create_trip_update("trip_2"),
        create_trip_update("trip_3"),
    ]

    trip_updates = gtfs_rt_service.get_real_time_trip_updates(trip_ids)
    gtfs_rt_service.gtfs_rt_client.load_trip_updates.assert_called_with()
    assert len(trip_updates) == 2


def test_get_real_time_vehicle_positions_all(gtfs_rt_service):
    vehicle_position = VehiclePosition()
    gtfs_rt_service.gtfs_rt_client.load_vehicle_positions.return_value = [
        vehicle_position
    ]

    result = gtfs_rt_service.get_real_time_vehicle_positions()

    assert len(result) == 1
    gtfs_rt_service.gtfs_rt_client.load_vehicle_positions.assert_called_with()


def test_get_all_real_time_trip_updates_by_trip_id(gtfs_rt_service):
    gtfs_rt_service.gtfs_rt_client.load_trip_updates.return_value = [
        create_trip_update("trip_1"),
        create_trip_update("trip_2"),
    ]

    result = gtfs_rt_service.get_all_real_time_trip_updates(trip_id="trip_1")
    assert len(result) == 1
    assert result[0].trip.trip_id == "trip_1"


def test_get_all_real_time_trip_updates_by_route_id(gtfs_rt_service):
    tu1 = create_trip_update("trip_1")
    tu1.trip.route_id = "route_1"
    tu2 = create_trip_update("trip_2")
    tu2.trip.route_id = "route_2"

    gtfs_rt_service.gtfs_rt_client.load_trip_updates.return_value = [tu1, tu2]

    result = gtfs_rt_service.get_all_real_time_trip_updates(route_id="route_1")
    assert len(result) == 1
    assert result[0].trip.route_id == "route_1"


def test_get_all_real_time_trip_updates_none(gtfs_rt_service):
    gtfs_rt_service.gtfs_rt_client.load_trip_updates.return_value = [
        create_trip_update("trip_1")
    ]

    result = gtfs_rt_service.get_all_real_time_trip_updates()
    assert len(result) == 1


def test_get_real_time_trip_updates_on_route(gtfs_rt_service, mocker):
    tu1 = create_trip_update("trip_1")
    tu1.trip.route_id = "route_1"
    gtfs_rt_service.gtfs_rt_client.load_trip_updates.return_value = [tu1]

    mock_trip = mocker.Mock()
    mock_trip.direction_id = 0
    mocker.patch(
        "server.services.gtfs_service.GTFSService.get_trip_by_id",
        return_value=mock_trip,
    )

    result = gtfs_rt_service.get_real_time_trip_updates_on_route("route_1", 0)
    assert len(result) == 1


def test_get_real_time_trip_updates_no_trip_ids(gtfs_rt_service, mocker):
    gtfs_rt_service.gtfs_rt_client.load_trip_updates.return_value = [
        create_trip_update("trip_1"),
        create_trip_update("trip_2"),
        create_trip_update("trip_3"),
    ]

    trip_updates = gtfs_rt_service.get_real_time_trip_updates(
        ["trip_1", "trip_2", "trip_3"]
    )
    gtfs_rt_service.gtfs_rt_client.load_trip_updates.assert_called_with()
    assert len(trip_updates) == 3


def test_get_arrival_time_by_stop_id(gtfs_rt_service):
    stop_time_updates: List[TripUpdate.StopTimeUpdate] = [
        create_stop_time_update("stop_1"),
        create_stop_time_update("stop_2"),
        create_stop_time_update("stop_3"),
    ]

    stop_time_update = gtfs_rt_service.get_arrival_time_by_stop_id(
        stop_time_updates, "stop_2"
    )

    assert stop_time_update is not None
    assert stop_time_update.stop_id == "stop_2"


def test_get_arrival_time_by_stop_id_not_found(gtfs_rt_service):
    stop_time_updates: List[TripUpdate.StopTimeUpdate] = [
        create_stop_time_update("stop_1"),
        create_stop_time_update("stop_2"),
        create_stop_time_update("stop_3"),
    ]

    stop_time_update = gtfs_rt_service.get_arrival_time_by_stop_id(
        stop_time_updates, "stop_4"
    )

    assert stop_time_update is None
