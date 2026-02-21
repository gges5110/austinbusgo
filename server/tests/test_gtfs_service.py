import pytest
from datetime import datetime
from server.services.gtfs_service import GTFSService
from server.models.gtfs_models import AggregatedShape, FeedInfo


def test_get_route(gtfs_service, mock_route, mocker):
    """Test getting a single route by ID"""
    route_obj = mock_route("1")
    mock_get = mocker.patch(
        "server.services.gtfs_service.Routes.get_by_id", return_value=route_obj
    )

    result = gtfs_service.get_route("1")

    mock_get.assert_called_once_with("1")
    assert result == route_obj


def test_get_routes(gtfs_service, mock_route, mocker):
    """Test getting all routes"""
    routes = [mock_route("1"), mock_route("2")]
    mock_select = mocker.patch(
        "server.services.gtfs_service.Routes.select", return_value=routes
    )

    result = gtfs_service.get_routes()

    mock_select.assert_called_once()
    assert result == routes


def test_get_routes_by_name_single_term(gtfs_service, mock_route, mocker):
    """Test searching routes by a single search term"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Routes.select", return_value=mock_query
    )
    mock_query.where.return_value = [mock_route("1")]

    result = gtfs_service.get_routes_by_name(["Airport"])

    mock_select.assert_called_once()
    mock_query.where.assert_called_once()
    assert len(result) == 1


def test_get_routes_by_name_multiple_terms(gtfs_service, mock_route, mocker):
    """Test searching routes by multiple search terms using OR logic"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Routes.select", return_value=mock_query
    )

    route1 = mock_route("18", "18")
    route1.route_long_name = "18-Martin Luther King"
    route2 = mock_route("801", "801")
    route2.route_long_name = "801-N Lamar S Congress"

    mock_query.where.return_value = [route1, route2]

    result = gtfs_service.get_routes_by_name(["Martin", "Luther"])

    mock_select.assert_called_once()
    mock_query.where.assert_called_once()
    assert len(result) == 2


def test_get_routes_by_name_partial_match(gtfs_service, mock_route, mocker):
    """Test partial multi-word search like 'Martin Luther' matching 'Martin Luther King'"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Routes.select", return_value=mock_query
    )

    route = mock_route("18", "18")
    route.route_long_name = "18-Martin Luther King"
    mock_query.where.return_value = [route]

    result = gtfs_service.get_routes_by_name(["Martin", "Luther"])

    mock_select.assert_called_once()
    mock_query.where.assert_called_once()
    assert len(result) == 1
    assert result[0].route_id == "18"


def test_get_routes_by_name_case_insensitive(gtfs_service, mock_route, mocker):
    """Test that search is case-insensitive"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Routes.select", return_value=mock_query
    )

    route = mock_route("18", "18")
    route.route_long_name = "18-Martin Luther King"
    mock_query.where.return_value = [route]

    result = gtfs_service.get_routes_by_name(["martin", "luther"])

    mock_select.assert_called_once()
    mock_query.where.assert_called_once()
    assert len(result) == 1


def test_get_routes_at_stop(gtfs_service, mock_route, mocker):
    """Test getting routes that serve a specific stop"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Routes.select", return_value=mock_query
    )
    mock_query.join.return_value = [mock_route("1")]

    result = gtfs_service.get_routes_at_stop("stop_1")

    mock_select.assert_called_once()
    mock_query.join.assert_called_once()


# Stop Tests
def test_get_stop(gtfs_service, mock_stop, mocker):
    """Test getting a single stop by ID"""
    stop_obj = mock_stop("stop_1")
    mock_get = mocker.patch(
        "server.services.gtfs_service.Stops.get_by_id", return_value=stop_obj
    )

    result = gtfs_service.get_stop("stop_1")

    mock_get.assert_called_once_with("stop_1")
    assert result == stop_obj


def test_get_stops_by_name_single_term(gtfs_service, mock_stop, mocker):
    """Test searching stops by a single search term"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Stops.select", return_value=mock_query
    )
    mock_query.where.return_value = [mock_stop("stop_1", "Airport")]

    result = gtfs_service.get_stops_by_name(["Airport"])

    mock_select.assert_called_once()
    mock_query.where.assert_called_once()


def test_get_stops_by_name_multiple_terms(gtfs_service, mock_stop, mocker):
    """Test searching stops by multiple search terms using OR logic"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Stops.select", return_value=mock_query
    )

    stop1 = mock_stop("2877", "6904 Airport/Lamar")
    stop2 = mock_stop("4155", "1900 Lamar/Martin Luther King")

    mock_query.where.return_value = [stop1, stop2]

    result = gtfs_service.get_stops_by_name(["Airport", "Lamar"])

    mock_select.assert_called_once()
    mock_query.where.assert_called_once()
    assert len(result) == 2


def test_get_stops_by_name_multiple_fields(gtfs_service, mock_stop, mocker):
    """Test that multi-word search checks all relevant fields"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Stops.select", return_value=mock_query
    )

    stop = mock_stop("stop_1", "Central Station")
    stop.at_street = "Main St"
    stop.on_street = "1st Ave"
    stop.stop_code = "CS001"

    mock_query.where.return_value = [stop]

    result = gtfs_service.get_stops_by_name(["Main", "Central"])

    mock_select.assert_called_once()
    mock_query.where.assert_called_once()
    assert len(result) == 1


def test_get_stops_by_name_partial_street_match(gtfs_service, mock_stop, mocker):
    """Test partial multi-word search matching stop names"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Stops.select", return_value=mock_query
    )

    stop = mock_stop("4155", "1900 Lamar/Martin Luther King")
    mock_query.where.return_value = [stop]

    result = gtfs_service.get_stops_by_name(["Martin", "Luther"])

    mock_select.assert_called_once()
    mock_query.where.assert_called_once()
    assert len(result) == 1
    assert result[0].stop_id == "4155"


def test_get_stops_by_name_case_insensitive(gtfs_service, mock_stop, mocker):
    """Test that stop search is case-insensitive"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Stops.select", return_value=mock_query
    )

    stop = mock_stop("stop_1", "Airport Terminal")
    mock_query.where.return_value = [stop]

    result = gtfs_service.get_stops_by_name(["airport", "terminal"])

    mock_select.assert_called_once()
    mock_query.where.assert_called_once()
    assert len(result) == 1


def test_get_near_by_stops(gtfs_service, mock_stop, mocker):
    """Test finding nearby stops by coordinates"""
    mock_stop_obj = mock_stop("stop_1")
    mock_raw = mocker.patch(
        "server.services.gtfs_service.Stops.raw", return_value=[mock_stop_obj]
    )

    result = gtfs_service.get_near_by_stops(30.2672, -97.7431)

    mock_raw.assert_called_once()
    assert len(result) == 1
    assert result[0].stop_id == "stop_1"


def test_get_near_by_stops_bounding_box(gtfs_service, mock_stop, mocker):
    """Test finding nearby stops within a bounding box"""
    mock_stop_obj = mock_stop("stop_1")
    mock_raw = mocker.patch(
        "server.services.gtfs_service.Stops.raw", return_value=[mock_stop_obj]
    )

    # Provide bounding box parameters
    result = gtfs_service.get_near_by_stops(
        30.2672, -97.7431, min_lat=30.0, min_lon=-98.0, max_lat=31.0, max_lon=-97.0
    )

    mock_raw.assert_called_once()
    # Verify that the spatial filter in the SQL was adjusted (implicitly by execution)
    assert len(result) == 1


def test_get_stops_by_route_id(gtfs_service, mock_stop, mocker):
    """Test getting stops for a specific route and direction"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Stops.select", return_value=mock_query
    )
    mock_query.distinct.return_value = mock_query
    mock_query.join = mocker.MagicMock(return_value=mock_query)
    mock_query.where.return_value = [mock_stop("stop_1")]

    result = gtfs_service.get_stops_by_route_id("1", 0)

    mock_select.assert_called_once()
    assert mock_query.join.call_count == 2
    mock_query.where.assert_called_once()


# Trip Tests
def test_get_trips_by_distinct_short_name(gtfs_service, mock_trip, mocker):
    """Test getting distinct trips by route and date"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Trips.select", return_value=mock_query
    )
    mock_query.join.return_value = mock_query
    mock_query.distinct.return_value = mock_query
    mock_query.where.return_value = mock_query
    mock_query.order_by.return_value = [mock_trip("trip_1")]

    result = gtfs_service.get_trips_by_distinct_short_name("1", "2025-01-01")

    mock_select.assert_called_once()
    mock_query.join.assert_called_once()
    mock_query.where.assert_called_once()


def test_get_all_trips(gtfs_service, mock_trip, mocker):
    """Test getting all trips"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Trips.select", return_value=mock_query
    )
    mock_query.distinct.return_value = mock_query
    mock_query.join.return_value = [mock_trip("trip_1")]

    result = gtfs_service.get_all_trips()

    mock_select.assert_called_once()
    mock_query.join.assert_called_once()


def test_get_trips_for_date(gtfs_service, mock_trip, mocker):
    """Test getting trips for a specific route and date"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Trips.select", return_value=mock_query
    )
    mock_query.join = mocker.MagicMock(return_value=mock_query)
    mock_query.where.return_value = [mock_trip("trip_1")]

    result = gtfs_service.get_trips_for_date("1", "2025-01-01")

    mock_select.assert_called_once()
    assert mock_query.join.call_count == 2
    mock_query.where.assert_called_once()


def test_get_trips_with_direction_and_route(gtfs_service, mocker):
    """Test filtering trips by direction and route"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Trips.select", return_value=mock_query
    )

    mock_trip1 = mocker.Mock()
    mock_trip1.trip_id = "trip_1"
    mock_trip2 = mocker.Mock()
    mock_trip2.trip_id = "trip_2"

    mock_query.where.return_value = [mock_trip1, mock_trip2]

    result = gtfs_service.get_trips_with_direction_and_route(
        ["trip_1", "trip_2", "trip_3"], "1", 0
    )

    mock_select.assert_called_once()
    mock_query.where.assert_called_once()
    assert result == ["trip_1", "trip_2"]


def test_get_trip_by_id(gtfs_service, mock_trip, mocker):
    """Test getting a single trip by ID"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.Trips.select", return_value=mock_query
    )
    mock_query.join.return_value = mock_query
    trip_obj = mock_trip("trip_1")
    mock_query.where.return_value = [trip_obj]

    result = gtfs_service.get_trip_by_id("trip_1")

    mock_select.assert_called_once()
    mock_query.join.assert_called_once()
    mock_query.where.assert_called_once()
    assert result == trip_obj


# Shape Tests
def test_get_shapes_by_trip_id(gtfs_service, mock_trip, mocker):
    """Test getting shapes by trip ID"""
    trip_obj = mock_trip("trip_1", shape_id="shape_1")
    mock_get_trip = mocker.patch(
        "server.services.gtfs_service.Trips.get_by_id", return_value=trip_obj
    )

    shape_obj = mocker.Mock(spec=AggregatedShape)
    shape_obj.shape_id = "shape_1"
    mock_get_shapes = mocker.patch(
        "server.services.gtfs_service.GTFSService.get_shapes_by_shape_id",
        return_value=shape_obj,
    )

    result = gtfs_service.get_shapes_by_trip_id("trip_1")

    mock_get_trip.assert_called_once_with("trip_1")
    mock_get_shapes.assert_called_once_with("shape_1")
    assert result == shape_obj


def test_get_shapes_by_shape_id(gtfs_service, mocker):
    """Test getting shapes by shape ID"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.AggregatedShape.select", return_value=mock_query
    )
    shape_obj = mocker.Mock(spec=AggregatedShape)
    mock_query.where.return_value = [shape_obj]

    result = gtfs_service.get_shapes_by_shape_id("shape_1")

    mock_select.assert_called_once()
    mock_query.where.assert_called_once()
    assert result == shape_obj


# StopTime Tests
def test_get_stop_time(gtfs_service, mock_stop_time, mocker):
    """Test getting a specific stop time"""
    stop_time_obj = mock_stop_time("trip_1", "stop_1")
    mock_get = mocker.patch(
        "server.services.gtfs_service.StopTimes.get", return_value=stop_time_obj
    )

    result = gtfs_service.get_stop_time("trip_1", "stop_1")

    mock_get.assert_called_once()
    assert result == stop_time_obj


def test_get_stop_times_by_trip_id(gtfs_service, mock_stop_time, mocker):
    """Test getting all stop times for a trip"""
    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.StopTimes.select", return_value=mock_query
    )
    mock_query.join.return_value = mock_query
    mock_query.where.return_value = [mock_stop_time("trip_1", "stop_1")]

    result = gtfs_service.get_stop_times_by_trip_id("trip_1")

    mock_select.assert_called_once()
    mock_query.join.assert_called_once()
    mock_query.where.assert_called_once()


def test_get_stop_times_by_stop_id(gtfs_service, mock_stop_time, mocker):
    """Test getting stop times for a stop on a specific date"""
    mock_now = datetime(2025, 1, 1, 10, 0, 0)
    mocker.patch("server.services.gtfs_service.datetime", wraps=datetime)
    mock_dt = mocker.patch("server.services.gtfs_service.datetime")
    mock_dt.now.return_value = mock_now

    mock_query = mocker.Mock()
    mock_select = mocker.patch(
        "server.services.gtfs_service.StopTimes.select", return_value=mock_query
    )
    mock_query.join = mocker.MagicMock(return_value=mock_query)
    mock_query.where.return_value = mock_query
    mock_query.order_by.return_value = [mock_stop_time("trip_1", "stop_1")]

    result = gtfs_service.get_stop_times_by_stop_id("stop_1", "2025-01-01")

    mock_select.assert_called_once()
    assert mock_query.join.call_count == 4
    mock_query.where.assert_called_once()
    mock_query.order_by.assert_called_once()


def test_get_earliest_arrival_times_on_route(gtfs_service, mock_stop_time, mocker):
    """Test getting earliest arrival times for a route"""
    mock_subquery = mocker.Mock()
    mock_subquery.join = mocker.MagicMock(return_value=mock_subquery)
    mock_subquery.where.return_value = mock_subquery
    mock_subquery.group_by.return_value = mock_subquery
    mock_subquery.alias.return_value = mock_subquery
    mock_subquery.c = mocker.Mock()
    mock_subquery.c.arrival_time = "arrival_time"
    mock_subquery.c.stop_id = "stop_id"

    mock_main_query = mocker.Mock()
    mock_main_query.join = mocker.MagicMock(return_value=mock_main_query)
    mock_main_query.where.return_value = mock_main_query
    mock_main_query.order_by.return_value = [
        mock_stop_time("trip_1", "stop_1", "10:00:00")
    ]

    mock_select = mocker.patch(
        "server.services.gtfs_service.StopTimes.select",
        side_effect=[mock_subquery, mock_main_query],
    )

    result = gtfs_service.get_earliest_arrival_times_on_route(
        "1", 0, "2025-01-01", "10:00:00"
    )

    assert mock_select.call_count == 2
    assert len(result) == 1


# FeedInfo Tests
def test_get_feed_info(gtfs_service, mocker):
    """Test getting feed info"""
    feed_info_obj = mocker.Mock(spec=FeedInfo)
    feed_info_obj.feed_publisher_name = "Capital Metro"
    mock_get = mocker.patch(
        "server.services.gtfs_service.FeedInfo.get", return_value=feed_info_obj
    )

    result = gtfs_service.get_feed_info()

    mock_get.assert_called_once()
    assert result == feed_info_obj
