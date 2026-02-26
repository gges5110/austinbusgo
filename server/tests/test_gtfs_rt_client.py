import pytest
from google.transit.gtfs_realtime_pb2 import (
    FeedMessage,
    FeedEntity,
    TripUpdate,
    VehiclePosition,
    TripDescriptor,
)
from server.services.gtfs_rt_client import GTFSRTClient

mock_trip_updates_pb_file_url = "http://url1"
mock_vehicle_positions_pb_file_url = "http://url2"


@pytest.fixture
def client():
    return GTFSRTClient(
        mock_trip_updates_pb_file_url, mock_vehicle_positions_pb_file_url
    )


def get_mock_feed_entity():
    feed_entity = FeedEntity()
    feed_entity.id = "1"
    return feed_entity


def get_mock_trip(route_id="2"):
    trip = TripDescriptor()
    trip.route_id = route_id
    return trip


def get_mock_trip_update():
    trip_update = TripUpdate()
    trip = get_mock_trip()
    trip_update.trip.CopyFrom(trip)
    return trip_update


def test_load_trip_updates(client, mocker):
    mock_get = mocker.patch(
        "server.services.gtfs_rt_client.GTFSRTClient._get_feed_message_entity_from_url"
    )

    feed_message = FeedMessage()
    feed_entity = get_mock_feed_entity()
    trip_update = get_mock_trip_update()
    feed_entity.trip_update.CopyFrom(trip_update)
    feed_message.entity.append(feed_entity)

    mock_get.return_value = feed_message.entity

    trip_updates = client.load_trip_updates()

    mock_get.assert_called_with(mock_trip_updates_pb_file_url)
    assert len(trip_updates) == 1
    assert trip_updates[0] == trip_update


def test_get_feed_message_entity_from_url(client, mocker):
    mock_get = mocker.patch("server.services.gtfs_rt_client.httpx.get")

    feed_message = FeedMessage()
    feed_message.header.gtfs_realtime_version = "2.0"
    feed_entity = feed_message.entity.add()
    feed_entity.id = "1"

    mock_response = mocker.Mock()
    mock_response.content = feed_message.SerializeToString()
    mock_get.return_value = mock_response

    result = client._get_feed_message_entity_from_url("http://test-url")

    mock_get.assert_called_with("http://test-url", follow_redirects=True)
    assert len(result) == 1
    assert result[0].id == "1"


def test_load_vehicle_positions(client, mocker):
    mock_get = mocker.patch(
        "server.services.gtfs_rt_client.GTFSRTClient._get_feed_message_entity_from_url"
    )

    feed_message = FeedMessage()
    feed_entity = get_mock_feed_entity()
    vehicle_position = VehiclePosition()
    trip = get_mock_trip()
    vehicle_position.trip.CopyFrom(trip)
    feed_entity.vehicle.CopyFrom(vehicle_position)
    feed_message.entity.append(feed_entity)

    mock_get.return_value = feed_message.entity

    vehicle_positions = client.load_vehicle_positions()

    mock_get.assert_called_with(mock_vehicle_positions_pb_file_url)
    assert len(vehicle_positions) == 1
    assert vehicle_positions[0] == vehicle_position


def test_load_vehicle_positions_with_route_id(client, mocker):
    mock_get = mocker.patch(
        "server.services.gtfs_rt_client.GTFSRTClient._get_feed_message_entity_from_url"
    )

    feed_message = FeedMessage()
    feed_entity = get_mock_feed_entity()
    vehicle_position = VehiclePosition()
    trip = get_mock_trip("3")
    vehicle_position.trip.CopyFrom(trip)
    feed_entity.vehicle.CopyFrom(vehicle_position)
    feed_message.entity.append(feed_entity)

    mock_get.return_value = feed_message.entity

    vehicle_positions = client.load_vehicle_positions("3")

    mock_get.assert_called_with(mock_vehicle_positions_pb_file_url)
    assert len(vehicle_positions) == 1
    assert vehicle_positions[0] == vehicle_position
