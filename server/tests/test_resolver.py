import unittest
from unittest.mock import MagicMock, patch, Mock
from datetime import datetime

from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate
from shapely import LineString

from server.gql.resolver import Resolver
from server.models.gtfs_models import Stops, Trips, Routes, FeedInfo, StopTimes
from server.services.gtfs_service import GTFSService
from server.services.gtfs_rt_service import GTFSRTService


def create_mock_stop(stop_id: str, stop_name: str = "Test Stop") -> Mock:
    """Create a mock Stop object"""
    stop = Mock(spec=Stops)
    stop.stop_id = stop_id
    stop.stop_name = stop_name
    stop.stop_time = Mock()
    stop.stop_time.stop_sequence = 1
    stop.stop_time.trip = Mock()
    stop.stop_time.trip.shape_id = "shape_1"
    return stop


def create_mock_trip(trip_id: str, route_id: str = "1") -> Mock:
    """Create a mock Trip object"""
    trip = Mock(spec=Trips)
    trip.trip_id = trip_id
    trip.route_id = route_id
    trip.shape_id = "shape_1"
    return trip


def create_mock_route(route_id: str, route_short_name: str = "1") -> Mock:
    """Create a mock Route object"""
    route = Mock(spec=Routes)
    route.route_id = route_id
    route.route_short_name = route_short_name
    return route


def create_mock_stop_time(
    trip_id: str, stop_id: str, arrival_time: str = "10:00:00"
) -> Mock:
    """Create a mock StopTime object"""
    stop_time = Mock(spec=StopTimes)
    stop_time.trip_id = trip_id
    stop_time.stop_id = stop_id
    stop_time.arrival_time = arrival_time
    stop_time.stop_sequence = 1
    stop_time.trip = create_mock_trip(trip_id)
    return stop_time


def create_trip_update_with_stop(
    trip_id: str, stop_id: str, arrival_time: int = None
) -> TripUpdate:
    """Create a TripUpdate with StopTimeUpdate"""
    trip_update = TripUpdate()
    trip_update.trip.trip_id = trip_id

    stop_time_update = trip_update.stop_time_update.add()
    stop_time_update.stop_id = stop_id
    if arrival_time:
        stop_time_update.arrival.time = arrival_time

    return trip_update


class TestResolver(unittest.TestCase):
    def setUp(self):
        self.mock_gtfs_service = Mock(spec=GTFSService)
        self.resolver = Resolver(gtfs_service=self.mock_gtfs_service)
        self.resolver.gtfs_rt_client = Mock()
        self.resolver.gtfs_rt_service = Mock(spec=GTFSRTService)

    # Trip Tests
    def test_resolve_trip(self):
        """Test resolving a single trip by ID"""
        mock_trip = create_mock_trip("trip_1")
        self.mock_gtfs_service.get_trip_by_id.return_value = mock_trip

        result = self.resolver.resolve_trip(None, None, "trip_1")

        self.mock_gtfs_service.get_trip_by_id.assert_called_once_with("trip_1")
        self.assertEqual(result, mock_trip)

    def test_resolve_distinct_trips(self):
        """Test resolving distinct trips by route and date"""
        mock_trips = [create_mock_trip("trip_1"), create_mock_trip("trip_2")]
        self.mock_gtfs_service.get_trips_by_distinct_short_name.return_value = (
            mock_trips
        )

        result = self.resolver.resolve_distinct_trips(None, None, "1", "2025-01-01")

        self.mock_gtfs_service.get_trips_by_distinct_short_name.assert_called_once_with(
            "1", "2025-01-01"
        )
        self.assertEqual(result, mock_trips)

    def test_resolve_trip_ids_for_route(self):
        """Test getting trip IDs for a route on a specific date"""
        mock_trips = [
            create_mock_trip("trip_1"),
            create_mock_trip("trip_2"),
            create_mock_trip("trip_3"),
        ]
        self.mock_gtfs_service.get_trips_for_date.return_value = mock_trips

        result = self.resolver.resolve_trip_ids_for_route(None, None, "1", "2025-01-01")

        self.mock_gtfs_service.get_trips_for_date.assert_called_once_with(
            "1", "2025-01-01"
        )
        self.assertEqual(result, {"tripIds": ["trip_1", "trip_2", "trip_3"]})

    # Stop Tests
    def test_resolve_stop(self):
        """Test resolving a single stop by ID"""
        mock_stop = create_mock_stop("stop_1")
        self.mock_gtfs_service.get_stop.return_value = mock_stop

        result = self.resolver.resolve_stop(None, None, "stop_1")

        self.mock_gtfs_service.get_stop.assert_called_once_with("stop_1")
        self.assertEqual(result, mock_stop)

    def test_resolve_near_by_stops(self):
        """Test finding nearby stops by coordinates"""
        mock_stops = [create_mock_stop("stop_1"), create_mock_stop("stop_2")]
        self.mock_gtfs_service.get_near_by_stops.return_value = mock_stops

        result = self.resolver.resolve_near_by_stops(None, None, 30.2672, -97.7431)

        self.mock_gtfs_service.get_near_by_stops.assert_called_once_with(
            30.2672, -97.7431, 1000.0, 20
        )
        self.assertEqual(result, mock_stops)

    def test_resolve_near_by_stops_with_custom_distance(self):
        """Test finding nearby stops with custom distance"""
        mock_stops = [create_mock_stop("stop_1")]
        self.mock_gtfs_service.get_near_by_stops.return_value = mock_stops

        result = self.resolver.resolve_near_by_stops(
            None, None, 30.2672, -97.7431, 0.05
        )

        self.mock_gtfs_service.get_near_by_stops.assert_called_once_with(
            30.2672, -97.7431, 0.05, 20
        )
        self.assertEqual(result, mock_stops)

    def test_resolve_near_by_stops_empty_result(self):
        """Test nearby stops when none are found"""
        self.mock_gtfs_service.get_near_by_stops.return_value = None

        result = self.resolver.resolve_near_by_stops(None, None, 30.2672, -97.7431)

        self.assertEqual(result, [])

    def test_resolve_stops_by_name(self):
        """Test finding stops by name"""
        mock_stops = [
            create_mock_stop("stop_1", "Airport"),
            create_mock_stop("stop_2", "Airport Terminal"),
        ]
        self.mock_gtfs_service.get_stops_by_name.return_value = mock_stops

        result = self.resolver.resolve_stops_by_name(None, None, "Airport")

        self.mock_gtfs_service.get_stops_by_name.assert_called_once_with("Airport")
        self.assertEqual(result, mock_stops)

    def test_resolve_stops_by_name_empty_result(self):
        """Test stops by name when none are found"""
        self.mock_gtfs_service.get_stops_by_name.return_value = None

        result = self.resolver.resolve_stops_by_name(None, None, "NonExistent")

        self.assertEqual(result, [])

    def test_resolve_stops_and_shapes(self):
        """Test resolving stops and shapes for a route"""
        mock_stops = [
            create_mock_stop("stop_1"),
            create_mock_stop("stop_2"),
        ]
        mock_stops[0].stop_time.stop_sequence = 2
        mock_stops[1].stop_time.stop_sequence = 1

        mock_shape = Mock()
        mock_shape.shape = LineString([(0, 0), (1, 1)])

        self.mock_gtfs_service.get_stops_by_route_id.return_value = mock_stops
        self.mock_gtfs_service.get_shapes_by_shape_id.return_value = mock_shape

        result = self.resolver.resolve_stops_and_shapes(
            None, None, "1", 0, "2025-01-01"
        )

        self.mock_gtfs_service.get_stops_by_route_id.assert_called_once_with("1", 0)
        # Verify stops are sorted by stop_sequence
        self.assertEqual(len(result["stops"]), 2)
        self.assertEqual(result["stops"][0].stop_id, "stop_2")  # sequence 1
        self.assertEqual(result["stops"][1].stop_id, "stop_1")  # sequence 2
        self.assertEqual(len(result["shapes"]), 1)

    # Route Tests
    def test_resolve_route(self):
        """Test resolving a single route by ID"""
        mock_route = create_mock_route("1")
        self.mock_gtfs_service.get_route.return_value = mock_route

        result = self.resolver.resolve_route(None, None, "1")

        self.mock_gtfs_service.get_route.assert_called_once_with("1")
        self.assertEqual(result, mock_route)

    def test_resolve_routes(self):
        """Test getting all routes"""
        mock_routes = [create_mock_route("1"), create_mock_route("2")]
        self.mock_gtfs_service.get_routes.return_value = mock_routes

        result = self.resolver.resolve_routes(None, None)

        self.mock_gtfs_service.get_routes.assert_called_once()
        self.assertEqual(result, mock_routes)

    def test_resolve_route_shapes(self):
        """Test getting route shapes by trip ID"""
        mock_shape = Mock()
        mock_shape.shape = LineString([(0, 0), (1, 1)])
        self.mock_gtfs_service.get_shapes_by_trip_id.return_value = mock_shape

        result = self.resolver.resolve_route_shapes(None, None, "trip_1")

        self.mock_gtfs_service.get_shapes_by_trip_id.assert_called_once_with("trip_1")
        self.assertIsInstance(result, LineString)

    # Real-time Tests
    def test_resolve_vehicle_positions(self):
        """Test getting real-time vehicle positions"""
        mock_positions = [VehiclePosition(), VehiclePosition()]
        self.resolver.gtfs_rt_service.get_real_time_vehicle_positions_on_route.return_value = (
            mock_positions
        )

        result = self.resolver.resolve_vehicle_positions(None, None, "1", 0)

        self.resolver.gtfs_rt_service.get_real_time_vehicle_positions_on_route.assert_called_once_with(
            "1", 0
        )
        self.assertEqual(result, mock_positions)

    def test_resolve_vehicle_positions_debug(self):
        """Test debug endpoint for all vehicle positions"""
        mock_positions = [VehiclePosition(), VehiclePosition()]
        self.resolver.gtfs_rt_service.get_real_time_vehicle_positions.return_value = (
            mock_positions
        )

        result = self.resolver.resolve_vehicle_positions_debug(None, None)

        self.resolver.gtfs_rt_service.get_real_time_vehicle_positions.assert_called_once()
        self.assertEqual(result, mock_positions)

    def test_resolve_trip_update(self):
        """Test getting single trip update"""
        mock_trip_update = TripUpdate()
        mock_trip_update.trip.trip_id = "trip_1"
        self.resolver.gtfs_rt_service.get_all_real_time_trip_updates.return_value = [
            mock_trip_update
        ]

        result = self.resolver.resolve_trip_update(None, None, "trip_1")

        self.resolver.gtfs_rt_service.get_all_real_time_trip_updates.assert_called_once_with(
            trip_id="trip_1"
        )
        self.assertEqual(result, mock_trip_update)

    def test_resolve_trip_update_not_found(self):
        """Test trip update when none are found"""
        self.resolver.gtfs_rt_service.get_all_real_time_trip_updates.return_value = []

        result = self.resolver.resolve_trip_update(None, None, "nonexistent")

        self.assertIsNone(result)

    def test_resolve_trip_updates(self):
        """Test getting multiple trip updates with filter"""
        mock_trip_updates = [TripUpdate(), TripUpdate()]
        mock_filter = Mock()
        mock_filter.route_id = "1"
        mock_filter.trip_id = "trip_1"

        self.resolver.gtfs_rt_service.get_all_real_time_trip_updates.return_value = (
            mock_trip_updates
        )

        result = self.resolver.resolve_trip_updates(None, None, mock_filter)

        self.resolver.gtfs_rt_service.get_all_real_time_trip_updates.assert_called_once_with(
            "1", "trip_1"
        )
        self.assertEqual(result, mock_trip_updates)

    # Stop Times Tests
    def test_resolve_stop_times(self):
        """Test getting stop times for a trip"""
        mock_stop_times = [
            create_mock_stop_time("trip_1", "stop_1"),
            create_mock_stop_time("trip_1", "stop_2"),
        ]
        self.mock_gtfs_service.get_stop_times_by_trip_id.return_value = mock_stop_times

        result = self.resolver.resolve_stop_times(None, None, "trip_1")

        self.mock_gtfs_service.get_stop_times_by_trip_id.assert_called_once_with(
            "trip_1"
        )
        self.assertEqual(result, mock_stop_times)

    # Search Tests
    def test_resolve_search(self):
        """Test search functionality"""
        mock_stops = [create_mock_stop("stop_1", "Airport")]
        mock_routes = [create_mock_route("1", "Airport Flyer")]

        self.mock_gtfs_service.get_stops_by_name.return_value = mock_stops
        self.mock_gtfs_service.get_routes_by_name.return_value = mock_routes

        result = self.resolver.resolve_search(None, None, "Airport Flyer")

        self.mock_gtfs_service.get_stops_by_name.assert_called_once_with(
            ["Airport", "Flyer"]
        )
        self.mock_gtfs_service.get_routes_by_name.assert_called_once_with(
            ["Airport", "Flyer"]
        )
        self.assertEqual(result["stops"], mock_stops)
        self.assertEqual(result["routes"], mock_routes)

    # Arrival Times Tests
    @patch("server.gql.resolver.datetime")
    @patch("server.gql.resolver.timezone")
    def test_resolve_arrival_times(self, mock_tz, mock_datetime):
        """Test resolving arrival times with real-time updates"""
        # Setup mock stop times
        mock_stop_times = [
            create_mock_stop_time("trip_1", "stop_1", "10:00:00"),
            create_mock_stop_time("trip_2", "stop_1", "10:30:00"),
        ]
        self.mock_gtfs_service.get_stop_times_by_stop_id.return_value = mock_stop_times

        # Setup mock trip updates
        trip_update = create_trip_update_with_stop("trip_1", "stop_1", 1234567890)
        self.resolver.gtfs_rt_service.get_real_time_trip_updates.return_value = [
            trip_update
        ]
        self.resolver.gtfs_rt_service.get_arrival_time_by_stop_id.return_value = (
            trip_update.stop_time_update[0]
        )

        # Mock datetime conversion
        mock_dt = Mock()
        mock_dt.astimezone.return_value.strftime.return_value = "10:05:00"
        mock_datetime.fromtimestamp.return_value = mock_dt

        result = self.resolver.resolve_arrival_times(None, None, "stop_1", "2025-01-01")

        self.mock_gtfs_service.get_stop_times_by_stop_id.assert_called_once_with(
            "stop_1", "2025-01-01"
        )
        self.resolver.gtfs_rt_service.get_real_time_trip_updates.assert_called_once_with(
            ["trip_1", "trip_2"]
        )
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["scheduled_arrival_time"], "10:00:00")

    @patch("server.gql.resolver.datetime")
    @patch("server.gql.resolver.timezone")
    def test_resolve_earliest_arrival_times_on_route(self, mock_tz, mock_datetime):
        """Test resolving earliest arrival times on a route"""
        # Setup mock earliest arrival times
        mock_arrival_time = Mock()
        mock_arrival_time.arrival_time = "10:00:00"
        mock_arrival_time.stop_id = "stop_1"
        mock_arrival_time.stop_sequence = 1
        mock_arrival_time.trip_id = "trip_1"

        self.mock_gtfs_service.get_earliest_arrival_times_on_route.return_value = [
            mock_arrival_time
        ]

        # Setup mock trip updates
        trip_update = create_trip_update_with_stop("trip_1", "stop_1", 1234567890)
        self.resolver.gtfs_rt_service.get_real_time_trip_updates_on_route.return_value = [
            trip_update
        ]
        self.resolver.gtfs_rt_service.get_arrival_time_by_stop_id.return_value = (
            trip_update.stop_time_update[0]
        )

        # Mock datetime conversion
        mock_dt = Mock()
        mock_dt.astimezone.return_value.strftime.return_value = "10:05:00"
        mock_datetime.fromtimestamp.return_value = mock_dt

        result = self.resolver.resolve_earliest_arrival_times_on_route(
            None, None, "1", 0, "2025-01-01", "10:00:00"
        )

        self.mock_gtfs_service.get_earliest_arrival_times_on_route.assert_called_once_with(
            "1", 0, "2025-01-01", "10:00:00"
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["scheduled_arrival_time"], "10:00:00")
        self.assertEqual(result[0]["stop_id"], "stop_1")
        self.assertEqual(result[0]["trip_id"], "trip_1")

    # Feed Info Tests
    def test_resolve_feed_info(self):
        """Test getting feed info"""
        mock_feed_info = Mock(spec=FeedInfo)
        mock_feed_info.feed_publisher_name = "Capital Metro"
        self.mock_gtfs_service.get_feed_info.return_value = mock_feed_info

        result = self.resolver.resolve_feed_info(None, None)

        self.mock_gtfs_service.get_feed_info.assert_called_once()
        self.assertEqual(result, mock_feed_info)

    # Helper Method Tests
    def test_get_updated_arrival_time_with_arrival_field(self):
        """Test _get_updated_arrival_time when arrival field is present"""
        stop_time_update = TripUpdate.StopTimeUpdate()
        stop_time_update.stop_id = "stop_1"
        stop_time_update.arrival.time = 1234567890

        self.resolver.gtfs_rt_service.get_arrival_time_by_stop_id.return_value = (
            stop_time_update
        )

        with patch("server.gql.resolver.datetime") as mock_datetime, patch(
            "server.gql.resolver.timezone"
        ):
            mock_dt = Mock()
            mock_dt.astimezone.return_value.strftime.return_value = "10:05:00"
            mock_datetime.fromtimestamp.return_value = mock_dt

            result = self.resolver._get_updated_arrival_time("stop_1", [])

            self.assertEqual(result, "10:05:00")

    def test_get_updated_arrival_time_with_departure_field(self):
        """Test _get_updated_arrival_time when only departure field is present"""
        stop_time_update = TripUpdate.StopTimeUpdate()
        stop_time_update.stop_id = "stop_1"
        stop_time_update.departure.time = 1234567890

        self.resolver.gtfs_rt_service.get_arrival_time_by_stop_id.return_value = (
            stop_time_update
        )

        with patch("server.gql.resolver.datetime") as mock_datetime, patch(
            "server.gql.resolver.timezone"
        ):
            mock_dt = Mock()
            mock_dt.astimezone.return_value.strftime.return_value = "10:05:00"
            mock_datetime.fromtimestamp.return_value = mock_dt

            result = self.resolver._get_updated_arrival_time("stop_1", [])

            self.assertEqual(result, "10:05:00")

    def test_get_updated_arrival_time_not_found(self):
        """Test _get_updated_arrival_time when stop is not found"""
        self.resolver.gtfs_rt_service.get_arrival_time_by_stop_id.return_value = None

        result = self.resolver._get_updated_arrival_time("stop_1", [])

        self.assertIsNone(result)

    def test_get_updated_arrival_time_skipped_stop(self):
        """Test _get_updated_arrival_time when stop is skipped (schedule_relationship=1)"""
        stop_time_update = TripUpdate.StopTimeUpdate()
        stop_time_update.stop_id = "stop_1"
        stop_time_update.schedule_relationship = 1  # SKIPPED

        self.resolver.gtfs_rt_service.get_arrival_time_by_stop_id.return_value = (
            stop_time_update
        )

        result = self.resolver._get_updated_arrival_time("stop_1", [])

        self.assertIsNone(result)

    def test_get_earliest_updated_arrival_time(self):
        """Test _get_earliest_updated_arrival_time finds the earliest time"""
        with patch.object(
            self.resolver, "_get_updated_arrival_time"
        ) as mock_get_updated:
            mock_get_updated.side_effect = ["10:30:00", "10:15:00", "10:45:00"]

            result = self.resolver._get_earliest_updated_arrival_time(
                "stop_1", [[], [], []]
            )

            self.assertEqual(result, "10:15:00")
            self.assertEqual(mock_get_updated.call_count, 3)

    def test_get_earliest_updated_arrival_time_with_none_values(self):
        """Test _get_earliest_updated_arrival_time with some None values"""
        with patch.object(
            self.resolver, "_get_updated_arrival_time"
        ) as mock_get_updated:
            mock_get_updated.side_effect = [None, "10:30:00", None, "10:15:00"]

            result = self.resolver._get_earliest_updated_arrival_time(
                "stop_1", [[], [], [], []]
            )

            self.assertEqual(result, "10:15:00")

    def test_get_earliest_updated_arrival_time_all_none(self):
        """Test _get_earliest_updated_arrival_time when all values are None"""
        with patch.object(
            self.resolver, "_get_updated_arrival_time"
        ) as mock_get_updated:
            mock_get_updated.return_value = None

            result = self.resolver._get_earliest_updated_arrival_time("stop_1", [[]])

            self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()
