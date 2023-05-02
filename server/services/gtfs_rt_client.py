from typing import List

import requests
from google.transit import gtfs_realtime_pb2
from google.transit.gtfs_realtime_pb2 import TripUpdate, VehiclePosition, FeedEntity

""" Responsible for requesting GTFS real time data. """


class GTFSRTClient:
    def __init__(self, trip_updates_pb_file_url: str, vehicle_positions_pb_file_url: str):
        self.trip_updates_pb_file_url = trip_updates_pb_file_url
        self.vehicle_positions_pb_file_url = vehicle_positions_pb_file_url

    def load_trip_updates(self) -> List[TripUpdate]:
        """
        Fetches list of trip updates.
        :return: list of trip updates.
        """
        feed_entity = GTFSRTClient._get_feed_message_entity_from_url(self.trip_updates_pb_file_url)
        return [entity.trip_update for entity in feed_entity]

    def load_vehicle_positions(self, route_id: str = None) -> List[VehiclePosition]:
        """
        Fetches list of vehicle positions of a given route id.
        :param route_id: the route id of the desired vehicle positions
        :return: list of vehicle positions.
        """
        feed_entities = GTFSRTClient._get_feed_message_entity_from_url(self.vehicle_positions_pb_file_url)
        # Convert feed to dict: https://mayors-ic.github.io/examples/gtfs-example.html
        return GTFSRTClient._get_valid_vehicles(feed_entities, route_id)

    def load_vehicle_position(self, trip_id: str):
        """
        Fetches list of vehicle positions of a given route id.
        :param route_id: the route id of the desired vehicle positions
        :return: list of vehicle positions.
        """
        feed_entities = GTFSRTClient._get_feed_message_entity_from_url(self.vehicle_positions_pb_file_url)
        # Convert feed to dict: https://mayors-ic.github.io/examples/gtfs-example.html
        return [feed_entity.vehicle for feed_entity in feed_entities if feed_entity.vehicle.HasField('trip') and
                feed_entity.vehicle.trip.trip_id == trip_id]

    @staticmethod
    def _get_feed_message_entity_from_url(url: str) -> FeedEntity:
        """
        retrieve feed message entity from a given url
        :param url: URL to get protobuf message from
        :return: feed message entity
        """
        response = requests.get(url)
        feed_message = gtfs_realtime_pb2.FeedMessage()
        feed_message.ParseFromString(response.content)
        return feed_message.entity

    @staticmethod
    def _get_valid_vehicles(feed_entities: List[FeedEntity], route_id: str) -> List[VehiclePosition]:
        """
        Filters out vehicles without a trip.
        :param route_id:
        :param feed_entities: list of vehicle positions to be filtered
        :return: list of vehicle positions with trips defined.
        """
        if route_id is None:
            return [feed_entity.vehicle for feed_entity in feed_entities if feed_entity.vehicle.HasField('trip')]
        else:
            return [feed_entity.vehicle for feed_entity in feed_entities if feed_entity.vehicle.HasField('trip') and
                    feed_entity.vehicle.trip.route_id == str(route_id)]
