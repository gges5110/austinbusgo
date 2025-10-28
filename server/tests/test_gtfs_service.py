import unittest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta

from server.services.gtfs_service import GTFSService
from server.models.gtfs_models import (
    Routes,
    Trips,
    Stops,
    StopTimes,
    CalendarDates,
    AggregatedShape,
    RoutesAtStop,
    FeedInfo,
)


def create_mock_route(route_id: str, route_short_name: str = "1") -> Mock:
    """Create a mock Route object"""
    route = Mock(spec=Routes)
    route.route_id = route_id
    route.route_short_name = route_short_name
    route.route_long_name = f"Route {route_short_name}"
    return route


def create_mock_stop(stop_id: str, stop_name: str = "Test Stop") -> Mock:
    """Create a mock Stop object"""
    stop = Mock(spec=Stops)
    stop.stop_id = stop_id
    stop.stop_name = stop_name
    stop.stop_code = f"CODE_{stop_id}"
    return stop


def create_mock_trip(
    trip_id: str, route_id: str = "1", shape_id: str = "shape_1"
) -> Mock:
    """Create a mock Trip object"""
    trip = Mock(spec=Trips)
    trip.trip_id = trip_id
    trip.route_id = route_id
    trip.shape_id = shape_id
    trip.direction_id = 0
    trip.trip_headsign = "Downtown"
    return trip


def create_mock_stop_time(
    trip_id: str, stop_id: str, arrival_time: str = "10:00:00"
) -> Mock:
    """Create a mock StopTime object"""
    stop_time = Mock(spec=StopTimes)
    stop_time.trip_id = trip_id
    stop_time.stop_id = stop_id
    stop_time.arrival_time = arrival_time
    stop_time.stop_sequence = 1
    return stop_time


class TestGTFSService(unittest.TestCase):
    def setUp(self):
        self.service = GTFSService()

    # Route Tests
    @patch("server.services.gtfs_service.Routes.get_by_id")
    def test_get_route(self, mock_get_by_id):
        """Test getting a single route by ID"""
        mock_route = create_mock_route("1")
        mock_get_by_id.return_value = mock_route

        result = self.service.get_route("1")

        mock_get_by_id.assert_called_once_with("1")
        self.assertEqual(result, mock_route)

    @patch("server.services.gtfs_service.Routes.select")
    def test_get_routes(self, mock_select):
        """Test getting all routes"""
        mock_routes = [create_mock_route("1"), create_mock_route("2")]
        mock_select.return_value = mock_routes

        result = self.service.get_routes()

        mock_select.assert_called_once()
        self.assertEqual(result, mock_routes)

    @patch("server.services.gtfs_service.Routes.select")
    def test_get_routes_by_name_single_term(self, mock_select):
        """Test searching routes by a single search term"""
        mock_query = Mock()
        mock_select.return_value = mock_query
        mock_query.where.return_value = [create_mock_route("1")]

        result = self.service.get_routes_by_name(["Airport"])

        mock_select.assert_called_once()
        mock_query.where.assert_called_once()
        self.assertEqual(len(result), 1)

    @patch("server.services.gtfs_service.Routes.select")
    def test_get_routes_by_name_multiple_terms(self, mock_select):
        """Test searching routes by multiple search terms using OR logic"""
        mock_query = Mock()
        mock_select.return_value = mock_query

        # Mock routes that match different terms
        route1 = create_mock_route("18", "18")
        route1.route_long_name = "18-Martin Luther King"

        route2 = create_mock_route("801", "801")
        route2.route_long_name = "801-N Lamar S Congress"

        mock_query.where.return_value = [route1, route2]

        result = self.service.get_routes_by_name(["Martin", "Luther"])

        mock_select.assert_called_once()
        mock_query.where.assert_called_once()
        # Should return routes matching ANY of the terms (OR logic)
        self.assertEqual(len(result), 2)

    @patch("server.services.gtfs_service.Routes.select")
    def test_get_routes_by_name_partial_match(self, mock_select):
        """Test partial multi-word search like 'Martin Luther' matching 'Martin Luther King'"""
        mock_query = Mock()
        mock_select.return_value = mock_query

        route = create_mock_route("18", "18")
        route.route_long_name = "18-Martin Luther King"
        mock_query.where.return_value = [route]

        result = self.service.get_routes_by_name(["Martin", "Luther"])

        mock_select.assert_called_once()
        mock_query.where.assert_called_once()
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].route_id, "18")

    @patch("server.services.gtfs_service.Routes.select")
    def test_get_routes_by_name_case_insensitive(self, mock_select):
        """Test that search is case-insensitive"""
        mock_query = Mock()
        mock_select.return_value = mock_query

        route = create_mock_route("18", "18")
        route.route_long_name = "18-Martin Luther King"
        mock_query.where.return_value = [route]

        result = self.service.get_routes_by_name(["martin", "luther"])

        mock_select.assert_called_once()
        mock_query.where.assert_called_once()
        self.assertEqual(len(result), 1)

    @patch("server.services.gtfs_service.Routes.select")
    def test_get_routes_at_stop(self, mock_select):
        """Test getting routes that serve a specific stop"""
        mock_query = Mock()
        mock_select.return_value = mock_query
        mock_query.join.return_value = [create_mock_route("1")]

        result = self.service.get_routes_at_stop("stop_1")

        mock_select.assert_called_once()
        mock_query.join.assert_called_once()

    # Stop Tests
    @patch("server.services.gtfs_service.Stops.get_by_id")
    def test_get_stop(self, mock_get_by_id):
        """Test getting a single stop by ID"""
        mock_stop = create_mock_stop("stop_1")
        mock_get_by_id.return_value = mock_stop

        result = self.service.get_stop("stop_1")

        mock_get_by_id.assert_called_once_with("stop_1")
        self.assertEqual(result, mock_stop)

    @patch("server.services.gtfs_service.Stops.select")
    def test_get_stops_by_name_single_term(self, mock_select):
        """Test searching stops by a single search term"""
        mock_query = Mock()
        mock_select.return_value = mock_query
        mock_query.where.return_value = [create_mock_stop("stop_1", "Airport")]

        result = self.service.get_stops_by_name(["Airport"])

        mock_select.assert_called_once()
        mock_query.where.assert_called_once()

    @patch("server.services.gtfs_service.Stops.select")
    def test_get_stops_by_name_multiple_terms(self, mock_select):
        """Test searching stops by multiple search terms using OR logic"""
        mock_query = Mock()
        mock_select.return_value = mock_query

        # Mock stops that match different terms
        stop1 = create_mock_stop("2877", "6904 Airport/Lamar")
        stop2 = create_mock_stop("4155", "1900 Lamar/Martin Luther King")

        mock_query.where.return_value = [stop1, stop2]

        result = self.service.get_stops_by_name(["Airport", "Lamar"])

        mock_select.assert_called_once()
        mock_query.where.assert_called_once()
        # Should return stops matching ANY of the terms (OR logic)
        self.assertEqual(len(result), 2)

    @patch("server.services.gtfs_service.Stops.select")
    def test_get_stops_by_name_multiple_fields(self, mock_select):
        """Test that multi-word search checks all relevant fields"""
        mock_query = Mock()
        mock_select.return_value = mock_query

        stop = create_mock_stop("stop_1", "Central Station")
        stop.at_street = "Main St"
        stop.on_street = "1st Ave"
        stop.stop_code = "CS001"

        mock_query.where.return_value = [stop]

        result = self.service.get_stops_by_name(["Main", "Central"])

        mock_select.assert_called_once()
        mock_query.where.assert_called_once()
        self.assertEqual(len(result), 1)

    @patch("server.services.gtfs_service.Stops.select")
    def test_get_stops_by_name_partial_street_match(self, mock_select):
        """Test partial multi-word search matching stop names"""
        mock_query = Mock()
        mock_select.return_value = mock_query

        stop = create_mock_stop("4155", "1900 Lamar/Martin Luther King")
        mock_query.where.return_value = [stop]

        result = self.service.get_stops_by_name(["Martin", "Luther"])

        mock_select.assert_called_once()
        mock_query.where.assert_called_once()
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].stop_id, "4155")

    @patch("server.services.gtfs_service.Stops.select")
    def test_get_stops_by_name_case_insensitive(self, mock_select):
        """Test that stop search is case-insensitive"""
        mock_query = Mock()
        mock_select.return_value = mock_query

        stop = create_mock_stop("stop_1", "Airport Terminal")
        mock_query.where.return_value = [stop]

        result = self.service.get_stops_by_name(["airport", "terminal"])

        mock_select.assert_called_once()
        mock_query.where.assert_called_once()
        self.assertEqual(len(result), 1)

    @patch("server.services.gtfs_service.Stops.select")
    def test_get_near_by_stops(self, mock_select):
        """Test finding nearby stops by coordinates"""
        mock_query = Mock()
        mock_select.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = [create_mock_stop("stop_1")]

        result = self.service.get_near_by_stops(30.2672, -97.7431)

        mock_select.assert_called_once()
        mock_query.order_by.assert_called_once()
        mock_query.limit.assert_called_once_with(20)

    @patch("server.services.gtfs_service.Stops.select")
    def test_get_stops_by_route_id(self, mock_select):
        """Test getting stops for a specific route and direction"""
        mock_query = Mock()
        mock_select.return_value = mock_query
        mock_query.distinct.return_value = mock_query
        mock_query.join = MagicMock(return_value=mock_query)
        mock_query.where.return_value = [create_mock_stop("stop_1")]

        result = self.service.get_stops_by_route_id("1", 0)

        mock_select.assert_called_once()
        self.assertEqual(mock_query.join.call_count, 2)
        mock_query.where.assert_called_once()

    # Trip Tests
    @patch("server.services.gtfs_service.Trips.select")
    def test_get_trips_by_distinct_short_name(self, mock_select):
        """Test getting distinct trips by route and date"""
        mock_query = Mock()
        mock_select.return_value = mock_query
        mock_query.join.return_value = mock_query
        mock_query.distinct.return_value = mock_query
        mock_query.where.return_value = mock_query
        mock_query.order_by.return_value = [create_mock_trip("trip_1")]

        result = self.service.get_trips_by_distinct_short_name("1", "2025-01-01")

        mock_select.assert_called_once()
        mock_query.join.assert_called_once()
        mock_query.where.assert_called_once()

    @patch("server.services.gtfs_service.Trips.select")
    def test_get_all_trips(self, mock_select):
        """Test getting all trips"""
        mock_query = Mock()
        mock_select.return_value = mock_query
        mock_query.distinct.return_value = mock_query
        mock_query.join.return_value = [create_mock_trip("trip_1")]

        result = self.service.get_all_trips()

        mock_select.assert_called_once()
        mock_query.join.assert_called_once()

    @patch("server.services.gtfs_service.Trips.select")
    def test_get_trips_for_date(self, mock_select):
        """Test getting trips for a specific route and date"""
        mock_query = Mock()
        mock_select.return_value = mock_query
        mock_query.join = MagicMock(return_value=mock_query)
        mock_query.where.return_value = [create_mock_trip("trip_1")]

        result = self.service.get_trips_for_date("1", "2025-01-01")

        mock_select.assert_called_once()
        self.assertEqual(mock_query.join.call_count, 2)
        mock_query.where.assert_called_once()

    @patch("server.services.gtfs_service.Trips.select")
    def test_get_trips_with_direction_and_route(self, mock_select):
        """Test filtering trips by direction and route"""
        mock_query = Mock()
        mock_select.return_value = mock_query

        mock_trip1 = Mock()
        mock_trip1.trip_id = "trip_1"
        mock_trip2 = Mock()
        mock_trip2.trip_id = "trip_2"

        mock_query.where.return_value = [mock_trip1, mock_trip2]

        result = self.service.get_trips_with_direction_and_route(
            ["trip_1", "trip_2", "trip_3"], "1", 0
        )

        mock_select.assert_called_once()
        mock_query.where.assert_called_once()
        self.assertEqual(result, ["trip_1", "trip_2"])

    @patch("server.services.gtfs_service.Trips.select")
    def test_get_trip_by_id(self, mock_select):
        """Test getting a single trip by ID"""
        mock_query = Mock()
        mock_select.return_value = mock_query
        mock_query.join.return_value = mock_query
        mock_trip = create_mock_trip("trip_1")
        mock_query.where.return_value = [mock_trip]

        result = self.service.get_trip_by_id("trip_1")

        mock_select.assert_called_once()
        mock_query.join.assert_called_once()
        mock_query.where.assert_called_once()
        self.assertEqual(result, mock_trip)

    # Shape Tests
    @patch("server.services.gtfs_service.Trips.get_by_id")
    @patch("server.services.gtfs_service.GTFSService.get_shapes_by_shape_id")
    def test_get_shapes_by_trip_id(self, mock_get_shapes, mock_get_trip):
        """Test getting shapes by trip ID"""
        mock_trip = create_mock_trip("trip_1", shape_id="shape_1")
        mock_get_trip.return_value = mock_trip

        mock_shape = Mock(spec=AggregatedShape)
        mock_shape.shape_id = "shape_1"
        mock_get_shapes.return_value = mock_shape

        result = self.service.get_shapes_by_trip_id("trip_1")

        mock_get_trip.assert_called_once_with("trip_1")
        mock_get_shapes.assert_called_once_with("shape_1")
        self.assertEqual(result, mock_shape)

    @patch("server.services.gtfs_service.AggregatedShape.select")
    def test_get_shapes_by_shape_id(self, mock_select):
        """Test getting shapes by shape ID"""
        mock_query = Mock()
        mock_select.return_value = mock_query
        mock_shape = Mock(spec=AggregatedShape)
        mock_query.where.return_value = [mock_shape]

        result = self.service.get_shapes_by_shape_id("shape_1")

        mock_select.assert_called_once()
        mock_query.where.assert_called_once()
        self.assertEqual(result, mock_shape)

    # StopTime Tests
    @patch("server.services.gtfs_service.StopTimes.get")
    def test_get_stop_time(self, mock_get):
        """Test getting a specific stop time"""
        mock_stop_time = create_mock_stop_time("trip_1", "stop_1")
        mock_get.return_value = mock_stop_time

        result = self.service.get_stop_time("trip_1", "stop_1")

        mock_get.assert_called_once()
        self.assertEqual(result, mock_stop_time)

    @patch("server.services.gtfs_service.StopTimes.select")
    def test_get_stop_times_by_trip_id(self, mock_select):
        """Test getting all stop times for a trip"""
        mock_query = Mock()
        mock_select.return_value = mock_query
        mock_query.join.return_value = mock_query
        mock_query.where.return_value = [create_mock_stop_time("trip_1", "stop_1")]

        result = self.service.get_stop_times_by_trip_id("trip_1")

        mock_select.assert_called_once()
        mock_query.join.assert_called_once()
        mock_query.where.assert_called_once()

    @patch("server.services.gtfs_service.StopTimes.select")
    @patch("server.services.gtfs_service.datetime")
    def test_get_stop_times_by_stop_id(self, mock_datetime, mock_select):
        """Test getting stop times for a stop on a specific date"""
        # Mock datetime.now()
        mock_now = datetime(2025, 1, 1, 10, 0, 0)
        mock_datetime.now.return_value = mock_now
        mock_datetime.side_effect = lambda *args, **kwargs: datetime(*args, **kwargs)

        mock_query = Mock()
        mock_select.return_value = mock_query
        mock_query.join = MagicMock(return_value=mock_query)
        mock_query.where.return_value = mock_query
        mock_query.order_by.return_value = [create_mock_stop_time("trip_1", "stop_1")]

        result = self.service.get_stop_times_by_stop_id("stop_1", "2025-01-01")

        mock_select.assert_called_once()
        self.assertEqual(mock_query.join.call_count, 4)
        mock_query.where.assert_called_once()
        mock_query.order_by.assert_called_once()

    @patch("server.services.gtfs_service.StopTimes.select")
    def test_get_earliest_arrival_times_on_route(self, mock_select):
        """Test getting earliest arrival times for a route"""
        # First select call for the subquery
        mock_subquery = Mock()
        mock_subquery.join = MagicMock(return_value=mock_subquery)
        mock_subquery.where.return_value = mock_subquery
        mock_subquery.group_by.return_value = mock_subquery
        mock_subquery.alias.return_value = mock_subquery
        mock_subquery.c = Mock()
        mock_subquery.c.arrival_time = "arrival_time"
        mock_subquery.c.stop_id = "stop_id"

        # Second select call for the main query
        mock_main_query = Mock()
        mock_main_query.join = MagicMock(return_value=mock_main_query)
        mock_main_query.where.return_value = mock_main_query
        mock_main_query.order_by.return_value = [
            create_mock_stop_time("trip_1", "stop_1", "10:00:00")
        ]

        # mock_select returns different queries on each call
        mock_select.side_effect = [mock_subquery, mock_main_query]

        result = self.service.get_earliest_arrival_times_on_route(
            "1", 0, "2025-01-01", "10:00:00"
        )

        self.assertEqual(mock_select.call_count, 2)
        self.assertEqual(len(result), 1)

    # FeedInfo Tests
    @patch("server.services.gtfs_service.FeedInfo.get")
    def test_get_feed_info(self, mock_get):
        """Test getting feed info"""
        mock_feed_info = Mock(spec=FeedInfo)
        mock_feed_info.feed_publisher_name = "Capital Metro"
        mock_get.return_value = mock_feed_info

        result = self.service.get_feed_info()

        mock_get.assert_called_once()
        self.assertEqual(result, mock_feed_info)


if __name__ == "__main__":
    unittest.main()
