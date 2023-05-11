from typing import List

import requests
from google.transit import gtfs_realtime_pb2
from google.transit.gtfs_realtime_pb2 import TripUpdate, VehiclePosition, FeedEntity

""" Responsible for requesting GTFS real time data. """


class GTFSRTClient:
    def __init__(
        self, trip_updates_pb_file_url: str, vehicle_positions_pb_file_url: str
    ):
        self.trip_updates_pb_file_url = trip_updates_pb_file_url
        self.vehicle_positions_pb_file_url = vehicle_positions_pb_file_url

    def load_trip_updates(self) -> List[TripUpdate]:
        feed_entities = GTFSRTClient._get_feed_message_entity_from_url(
            self.trip_updates_pb_file_url
        )
        return [entity.trip_update for entity in feed_entities]

    def load_vehicle_positions(self, route_id: str = None) -> List[VehiclePosition]:
        feed_entities = GTFSRTClient._get_feed_message_entity_from_url(
            self.vehicle_positions_pb_file_url
        )
        # Convert feed to dict: https://mayors-ic.github.io/examples/gtfs-example.html
        return GTFSRTClient._get_valid_vehicles(feed_entities, route_id)

    @staticmethod
    def _get_feed_message_entity_from_url(url: str) -> FeedEntity:
        response = requests.get(url)
        feed_message = gtfs_realtime_pb2.FeedMessage()
        feed_message.ParseFromString(response.content)
        return feed_message.entity

    @staticmethod
    def _get_valid_vehicles(
        feed_entities: List[FeedEntity], route_id: str
    ) -> List[VehiclePosition]:
        if route_id is None:
            return [
                feed_entity.vehicle
                for feed_entity in feed_entities
                if feed_entity.vehicle.HasField("trip")
            ]
        else:
            return [
                feed_entity.vehicle
                for feed_entity in feed_entities
                if feed_entity.vehicle.HasField("trip")
                and feed_entity.vehicle.trip.route_id == str(route_id)
            ]
