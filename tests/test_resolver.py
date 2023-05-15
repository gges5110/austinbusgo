from unittest import TestCase
from unittest.mock import patch, MagicMock

from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate

from server.gql.resolver import Resolver
from server.models.gtfs_models import StopTimes, Trips


def create_vehicle_position(trip_id: str, stop_sequence: int = None) -> VehiclePosition:
    vehicle_position = VehiclePosition()
    vehicle_position.trip.trip_id = trip_id
    if stop_sequence:
        vehicle_position.current_stop_sequence = stop_sequence
    return vehicle_position


def get_stop_time_side_effect(trip_id: str, stop_id: int) -> StopTimes:
    stop_time = StopTimes()
    stop_time.trip_id = trip_id
    stop_time.stop_sequence = 10
    stop_time.arrival_time = "8:05:59"
    return stop_time


class TestResolver(TestCase):
    def setUp(self) -> None:
        # TODO: make inject fake client and services into this resolver instance for testing purposes.
        self.resolver = Resolver()

    @patch("server.services.gtfs_service.GTFSService.get_trip_by_id")
    def test_resolve_trip(self, mock_get_trip_by_id):
        trip_id = "trip_1"
        mock_trip = {"trip_id": trip_id}

        mock_get_trip_by_id.return_value = mock_trip

        trip = self.resolver.resolve_trip(None, None, trip_id=trip_id)

        mock_get_trip_by_id.assert_called_with(trip_id)
        self.assertEqual(trip, mock_trip)

    @patch("server.services.gtfs_service.GTFSService.get_stops_by_trip_id")
    def test_resolve_stops(self, mock_get_stops_by_trip_id):
        mock_stops = [{"stop_id": "stop_1"}, {"stop_id": "stop_2"}]
        mock_get_stops_by_trip_id.return_value = mock_stops
        trip_id = "trip_1"

        stops = self.resolver.resolve_stops(None, None, trip_id=trip_id)

        mock_get_stops_by_trip_id.assert_called_with(trip_id)
        self.assertEqual(len(stops), len(mock_stops))
        self.assertListEqual(stops, mock_stops)

    @patch("server.services.gtfs_service.GTFSService.get_stop")
    def test_resolve_stop(self, mock_get_stop):
        stop_id = "stop_1"
        mock_stop = {"stop_id": stop_id, "stop_name": "stop 1"}
        mock_get_stop.return_value = mock_stop

        stop = self.resolver.resolve_stop(None, None, stop_id=stop_id)

        mock_get_stop.assert_called_with(stop_id)
        self.assertEqual(stop, mock_stop)

    @patch("server.services.gtfs_service.GTFSService.get_shapes_by_trip_id")
    def test_resolve_route_shapes(self, mock_get_shapes_by_trip_id):
        trip_id = "trip_1"
        mock_shapes = [{"shape_id": "shape_1"}, {"shape_id": "shape_2"}]

        mock_get_shapes_by_trip_id.return_value = mock_shapes

        shapes = self.resolver.resolve_route_shapes(None, None, trip_id=trip_id)

        mock_get_shapes_by_trip_id.assert_called_with(trip_id)
        self.assertEqual(len(shapes), len(mock_shapes))
        self.assertListEqual(shapes, mock_shapes)

    @patch(
        "server.services.gtfs_rt_service.GTFSRTService.get_real_time_vehicle_positions"
    )
    def test_resolve_vehicle_positions(self, mock_get_real_time_vehicle_positions):
        route_id = 3
        direction = True
        mock_vehicle_positions = [{"vehicle_id": "id_1"}, {"vehicle_id": "id_2"}]

        mock_get_real_time_vehicle_positions.return_value = mock_vehicle_positions

        vehicle_positions = self.resolver.resolve_vehicle_positions(
            None, None, route_id=route_id, direction=direction
        )

        mock_get_real_time_vehicle_positions.assert_called_with(
            str(route_id), direction
        )
        self.assertEqual(len(vehicle_positions), len(mock_vehicle_positions))
        self.assertListEqual(vehicle_positions, mock_vehicle_positions)

    # @patch('services.gtfs_rt_service.GTFSRTService.get_real_time_vehicle_positions')
    # @patch('gql.resolver.Resolver._remove_past_vehicles', MagicMock())
    # @patch('gql.resolver.Resolver._populate_updated_arrival_time', MagicMock())
    # @patch('gql.resolver.Resolver._populate_scheduled_arrival_time', MagicMock())
    # def test_resolve_arrival_times(self, mock_get_real_time_vehicle_positions):
    #     route_id = 3
    #     direction = True
    #     stop_id = 'stop_1'
    #     mock_vehicle_positions = [
    #         create_vehicle_position("trip_1"),
    #         create_vehicle_position("trip_2")
    #     ]
    #
    #     mock_get_real_time_vehicle_positions.return_value = mock_vehicle_positions
    #
    #     arrival_times = self.resolver.resolve_arrival_times(None, None, route_id, direction, stop_id)
    #
    #     mock_get_real_time_vehicle_positions.assert_called_with(str(route_id), direction)
    #     self.assertEqual(len(arrival_times), len(mock_vehicle_positions))
    #     self.assertListEqual(arrival_times, mock_vehicle_positions)

    @patch(
        "server.services.gtfs_service.GTFSService.get_stop_time",
        MagicMock(side_effect=get_stop_time_side_effect),
    )
    def test_remove_past_vehicles(self):
        stop_id = "stop_1"
        vehicle_by_trip_id = {
            "trip_1": create_vehicle_position("trip_1", 5),
            "trip_2": create_vehicle_position("trip_2", 10),
            "trip_3": create_vehicle_position("trip_3", 15),
        }

        self.resolver._remove_past_vehicles(vehicle_by_trip_id, stop_id)

        self.assertEqual(len(vehicle_by_trip_id), 2)
        self.assertListEqual(list(vehicle_by_trip_id), ["trip_1", "trip_2"])

    @patch(
        "server.services.gtfs_service.GTFSService.get_stop_time",
        MagicMock(side_effect=get_stop_time_side_effect),
    )
    def test_populate_scheduled_arrival_time(self):
        arrival_time_by_trip_id = {}
        stop_id = "stop_1"
        trip_id = "trip_1"

        self.resolver._populate_scheduled_arrival_time(
            arrival_time_by_trip_id, stop_id, trip_id
        )

        self.assertEqual(len(arrival_time_by_trip_id), 1)
        self.assertTrue(trip_id in arrival_time_by_trip_id)
        self.assertIsNotNone(arrival_time_by_trip_id[trip_id])
        self.assertEqual(
            arrival_time_by_trip_id[trip_id].scheduled_arrival_time, "8:05:59"
        )

    @patch(
        "server.services.gtfs_rt_service.GTFSRTService.get_real_time_vehicle_trip_ids",
        MagicMock(return_value=["trip_1", "trip_2", "trip_3"]),
    )
    @patch("server.services.gtfs_service.GTFSService.get_trips_with_distinct_headsign")
    def test_resolve_running_trips(self, mock_get_trips_with_distinct_headsign):
        mock_get_trips_with_distinct_headsign.return_value = [
            create_trip_and_route_mock("trip_1", "route_1"),
            create_trip_and_route_mock("trip_2", "route_2"),
            create_trip_and_route_mock("trip_3", "route_3"),
        ]

        running_trips = self.resolver.resolve_running_trips(None, None)
        self.assertEqual(len(running_trips), 3)

    # def test_populate_updated_arrival_time(self):
    #     arrival_time_dict: Dict[str, Any] = {}
    #     stop_id = 'stop_1'
    #     trip_update = TripUpdate()
    #     trip_update.stop_time_update = []
    #
    #     self.resolver._populate_updated_arrival_time(arrival_time_dict, stop_id)


def create_trip_and_route_mock(trip_id: str, route_id: str):
    trip = MagicMock()
    trip.trip_id = trip_id
    trip.route_id = route_id
    trip.trip_headsign = "headsign"
    trip.routes.route_color = ""
    return trip
