import unittest
from unittest.mock import patch

from google.transit.gtfs_realtime_pb2 import FeedMessage, FeedEntity, TripUpdate, VehiclePosition, TripDescriptor

from server.services.gtfs_rt_client import GTFSClient

mock_trip_updates_pb_file_url = 'http://url1'
mock_vehicle_positions_pb_file_url = 'http://url2'


class TestGTFSRTClient(unittest.TestCase):
    def setUp(self):
        self.client = GTFSClient(mock_trip_updates_pb_file_url, mock_vehicle_positions_pb_file_url)

    @patch('server.services.gtfs_rt_client.GTFSClient._get_feed_message_entity_from_url')
    def test_load_trip_updates(self, mock_gtfs_client_get_feed_message_entity_from_url):
        # Setup protobuf mock for trip update
        feed_message = FeedMessage()
        feed_entity = FeedEntity()
        trip_update = TripUpdate()
        feed_entity.trip_update.CopyFrom(trip_update)
        feed_message.entity.append(feed_entity)

        mock_gtfs_client_get_feed_message_entity_from_url.return_value = feed_message.entity

        trip_updates = self.client.load_trip_updates()

        mock_gtfs_client_get_feed_message_entity_from_url.assert_called_with(mock_trip_updates_pb_file_url)
        self.assertEqual(len(trip_updates), 1)
        self.assertEqual(trip_updates[0], trip_update)

    @patch('server.services.gtfs_rt_client.GTFSClient._get_feed_message_entity_from_url')
    def test_load_vehicle_positions(self, mock_gtfs_client_get_feed_message_entity_from_url):
        # Setup protobuf mock for vehicle position
        feed_message = FeedMessage()
        feed_entity = FeedEntity()
        vehicle_position = VehiclePosition()
        trip = TripDescriptor()
        trip.route_id = '2'
        vehicle_position.trip.CopyFrom(trip)
        feed_entity.vehicle.CopyFrom(vehicle_position)
        feed_message.entity.append(feed_entity)

        mock_gtfs_client_get_feed_message_entity_from_url.return_value = feed_message.entity

        vehicle_positions = self.client.load_vehicle_positions()

        mock_gtfs_client_get_feed_message_entity_from_url.assert_called_with(mock_vehicle_positions_pb_file_url)
        self.assertEqual(len(vehicle_positions), 1)
        self.assertEqual(vehicle_positions[0], vehicle_position)

    @patch('server.services.gtfs_rt_client.GTFSClient._get_feed_message_entity_from_url')
    def test_load_vehicle_positions_with_route_id(self, mock_gtfs_client_get_feed_message_entity_from_url):
        # Setup protobuf mock for vehicle position
        feed_message = FeedMessage()
        feed_entity = FeedEntity()
        vehicle_position = VehiclePosition()
        trip = TripDescriptor()
        trip.route_id = '3'
        vehicle_position.trip.CopyFrom(trip)
        feed_entity.vehicle.CopyFrom(vehicle_position)
        feed_message.entity.append(feed_entity)

        mock_gtfs_client_get_feed_message_entity_from_url.return_value = feed_message.entity

        vehicle_positions = self.client.load_vehicle_positions('3')

        mock_gtfs_client_get_feed_message_entity_from_url.assert_called_with(mock_vehicle_positions_pb_file_url)
        self.assertEqual(len(vehicle_positions), 1)
        self.assertEqual(vehicle_positions[0], vehicle_position)


if __name__ == '__main__':
    unittest.main()
