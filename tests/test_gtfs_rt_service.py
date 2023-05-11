import unittest
from unittest.mock import MagicMock, patch

from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate
from typing import List

from server.services.gtfs_rt_client import GTFSRTClient
from server.services.gtfs_rt_service import GTFSRTService

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


class TestGTFSRTService(unittest.TestCase):
    def setUp(self):
        self.client = GTFSRTClient(
            mock_trip_updates_pb_file_url, mock_vehicle_positions_pb_file_url
        )
        self.gtfs_rt_service = GTFSRTService(self.client)

    def test_get_real_time_vehicle_trip_ids(self):
        vehicle_position = VehiclePosition()
        vehicle_position.trip.trip_id = "trip_1"

        vehicle_position2 = VehiclePosition()
        vehicle_position2.trip.trip_id = "trip_1"
        self.client.load_vehicle_positions = MagicMock(
            return_value=[vehicle_position, vehicle_position2]
        )

        trip_ids = self.gtfs_rt_service.get_real_time_vehicle_trip_ids("3")

        self.client.load_vehicle_positions.assert_called_with(route_id="3")
        self.assertEqual(len(trip_ids), 2)

    @patch(
        "server.services.gtfs_service.GTFSService.get_trips_with_direction_and_route",
        MagicMock(return_value=["trip_2"]),
    )
    def test_get_real_time_vehicle_positions(self):
        vehicle_position = VehiclePosition()
        vehicle_position.trip.trip_id = "trip_1"

        vehicle_position2 = VehiclePosition()
        vehicle_position2.trip.trip_id = "trip_2"
        self.client.load_vehicle_positions = MagicMock(
            return_value=[vehicle_position, vehicle_position2]
        )

        vehicle_positions = (
            self.gtfs_rt_service.get_real_time_vehicle_positions_on_route("3", True)
        )

        self.assertEqual(len(vehicle_positions), 1)

    @patch("server.services.gtfs_rt_client.GTFSClient.load_trip_updates")
    def test_get_real_time_trip_updates(self, mock_load_trip_updates):
        trip_ids = ["trip_1", "trip_2"]
        mock_load_trip_updates.return_value = [
            create_trip_update("trip_1"),
            create_trip_update("trip_2"),
            create_trip_update("trip_3"),
        ]

        trip_updates = self.gtfs_rt_service.get_real_time_trip_updates(trip_ids)
        mock_load_trip_updates.assert_called_with()
        self.assertEqual(len(trip_updates), 2)

    @patch("server.services.gtfs_rt_client.GTFSClient.load_trip_updates")
    def test_get_real_time_trip_updates_no_trip_ids(self, mock_load_trip_updates):
        mock_load_trip_updates.return_value = [
            create_trip_update("trip_1"),
            create_trip_update("trip_2"),
            create_trip_update("trip_3"),
        ]

        trip_updates = self.gtfs_rt_service.get_real_time_trip_updates()
        mock_load_trip_updates.assert_called_with()
        self.assertEqual(len(trip_updates), 3)

    def test_get_arrival_time_by_stop_id(self):
        stop_time_updates: List[TripUpdate.StopTimeUpdate] = [
            create_stop_time_update("stop_1"),
            create_stop_time_update("stop_2"),
            create_stop_time_update("stop_3"),
        ]

        stop_time_update = self.gtfs_rt_service.get_arrival_time_by_stop_id(
            stop_time_updates, "stop_2"
        )

        self.assertIsNotNone(stop_time_update)

    def test_get_arrival_time_by_stop_id_not_found(self):
        stop_time_updates: List[TripUpdate.StopTimeUpdate] = [
            create_stop_time_update("stop_1"),
            create_stop_time_update("stop_2"),
            create_stop_time_update("stop_3"),
        ]

        stop_time_update = self.gtfs_rt_service.get_arrival_time_by_stop_id(
            stop_time_updates, "stop_4"
        )

        self.assertIsNone(stop_time_update)


if __name__ == "__main__":
    unittest.main()
