import pytest
from unittest.mock import MagicMock, Mock
from datetime import datetime
from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate
from shapely import LineString
from server.models.gtfs_models import FeedInfo


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


# Trip Tests
def test_resolve_trip(resolver, mock_trip):
    """Test resolving a single trip by ID"""
    trip_obj = mock_trip("trip_1")
    resolver.gtfs_service.get_trip_by_id.return_value = trip_obj

    result = resolver.resolve_trip(None, None, "trip_1")

    resolver.gtfs_service.get_trip_by_id.assert_called_once_with("trip_1")
    assert result == trip_obj


def test_resolve_distinct_trips(resolver, mock_trip):
    """Test resolving distinct trips by route and date"""
    trips = [mock_trip("trip_1"), mock_trip("trip_2")]
    resolver.gtfs_service.get_trips_by_distinct_short_name.return_value = trips

    result = resolver.resolve_distinct_trips(None, None, "1", "2025-01-01")

    resolver.gtfs_service.get_trips_by_distinct_short_name.assert_called_once_with(
        "1", "2025-01-01"
    )
    assert result == trips


def test_resolve_trip_ids_for_route(resolver, mock_trip):
    """Test getting trip IDs for a route on a specific date"""
    trips = [mock_trip("trip_1"), mock_trip("trip_2"), mock_trip("trip_3")]
    resolver.gtfs_service.get_trips_for_date.return_value = trips

    result = resolver.resolve_trip_ids_for_route(None, None, "1", "2025-01-01")

    resolver.gtfs_service.get_trips_for_date.assert_called_once_with("1", "2025-01-01")
    assert result == {"tripIds": ["trip_1", "trip_2", "trip_3"]}


# Stop Tests
def test_resolve_stop(resolver, mock_stop):
    """Test resolving a single stop by ID"""
    stop_obj = mock_stop("stop_1")
    resolver.gtfs_service.get_stop.return_value = stop_obj

    result = resolver.resolve_stop(None, None, "stop_1")

    resolver.gtfs_service.get_stop.assert_called_once_with("stop_1")
    assert result == stop_obj


def test_resolve_near_by_stops(resolver, mock_stop):
    """Test finding nearby stops by coordinates"""
    stops = [mock_stop("stop_1"), mock_stop("stop_2")]
    resolver.gtfs_service.get_near_by_stops.return_value = stops

    result = resolver.resolve_near_by_stops(None, None, 30.2672, -97.7431)

    resolver.gtfs_service.get_near_by_stops.assert_called_once_with(
        lat=30.2672,
        lon=-97.7431,
        radius=1000.0,
        limit=20,
        min_lat=None,
        min_lon=None,
        max_lat=None,
        max_lon=None,
    )
    assert result == stops


def test_resolve_near_by_stops_with_custom_distance(resolver, mock_stop):
    """Test finding nearby stops with custom distance"""
    stops = [mock_stop("stop_1")]
    resolver.gtfs_service.get_near_by_stops.return_value = stops

    result = resolver.resolve_near_by_stops(None, None, 30.2672, -97.7431, 0.05)

    resolver.gtfs_service.get_near_by_stops.assert_called_once_with(
        lat=30.2672,
        lon=-97.7431,
        radius=0.05,
        limit=20,
        min_lat=None,
        min_lon=None,
        max_lat=None,
        max_lon=None,
    )
    assert result == stops


def test_resolve_near_by_stops_empty_result(resolver):
    """Test nearby stops when none are found"""
    resolver.gtfs_service.get_near_by_stops.return_value = None

    result = resolver.resolve_near_by_stops(None, None, 30.2672, -97.7431)

    assert result == []


def test_resolve_stops_by_name(resolver, mock_stop):
    """Test finding stops by name"""
    stops = [mock_stop("stop_1", "Airport"), mock_stop("stop_2", "Airport Terminal")]
    resolver.gtfs_service.get_stops_by_name.return_value = stops

    result = resolver.resolve_stops_by_name(None, None, "Airport")

    resolver.gtfs_service.get_stops_by_name.assert_called_once_with("Airport")
    assert result == stops


def test_resolve_stops_by_name_empty_result(resolver):
    """Test stops by name when none are found"""
    resolver.gtfs_service.get_stops_by_name.return_value = None

    result = resolver.resolve_stops_by_name(None, None, "NonExistent")

    assert result == []


def test_resolve_stops_and_shapes(resolver, mock_stop):
    """Test resolving stops and shapes for a route"""
    stops = [mock_stop("stop_1"), mock_stop("stop_2")]
    stops[0].stop_time.stop_sequence = 2
    stops[1].stop_time.stop_sequence = 1

    mock_shape = Mock()
    mock_shape.shape = LineString([(0, 0), (1, 1)])

    resolver.gtfs_service.get_stops_by_route_id.return_value = stops
    resolver.gtfs_service.get_shapes_by_shape_id.return_value = mock_shape

    result = resolver.resolve_stops_and_shapes(None, None, "1", 0, "2025-01-01")

    resolver.gtfs_service.get_stops_by_route_id.assert_called_once_with("1", 0)
    assert len(result["stops"]) == 2
    assert result["stops"][0].stop_id == "stop_2"  # sequence 1
    assert result["stops"][1].stop_id == "stop_1"  # sequence 2
    assert len(result["shapes"]) == 1


# Route Tests
def test_resolve_route(resolver, mock_route):
    """Test resolving a single route by ID"""
    route_obj = mock_route("1")
    resolver.gtfs_service.get_route.return_value = route_obj

    result = resolver.resolve_route(None, None, "1")

    resolver.gtfs_service.get_route.assert_called_once_with("1")
    assert result == route_obj


def test_resolve_routes(resolver, mock_route):
    """Test getting all routes"""
    routes = [mock_route("1"), mock_route("2")]
    resolver.gtfs_service.get_routes.return_value = routes

    result = resolver.resolve_routes(None, None)

    resolver.gtfs_service.get_routes.assert_called_once()
    assert result == routes


def test_resolve_route_shapes(resolver):
    """Test getting route shapes by trip ID"""
    mock_shape = Mock()
    mock_shape.shape = LineString([(0, 0), (1, 1)])
    resolver.gtfs_service.get_shapes_by_trip_id.return_value = mock_shape

    result = resolver.resolve_route_shapes(None, None, "trip_1")

    resolver.gtfs_service.get_shapes_by_trip_id.assert_called_once_with("trip_1")
    assert isinstance(result, LineString)


# Real-time Tests
def test_resolve_vehicle_positions(resolver):
    """Test getting real-time vehicle positions"""
    positions = [VehiclePosition(), VehiclePosition()]
    resolver.gtfs_rt_service.get_real_time_vehicle_positions_on_route.return_value = (
        positions
    )

    result = resolver.resolve_vehicle_positions(None, None, "1", 0)

    resolver.gtfs_rt_service.get_real_time_vehicle_positions_on_route.assert_called_once_with(
        "1", 0
    )
    assert result == positions


def test_resolve_vehicle_positions_debug(resolver):
    """Test debug endpoint for all vehicle positions"""
    positions = [VehiclePosition(), VehiclePosition()]
    resolver.gtfs_rt_service.get_real_time_vehicle_positions.return_value = positions

    result = resolver.resolve_vehicle_positions_debug(None, None)

    resolver.gtfs_rt_service.get_real_time_vehicle_positions.assert_called_once()
    assert result == positions


def test_resolve_trip_update(resolver):
    """Test getting single trip update"""
    mock_trip_update = TripUpdate()
    mock_trip_update.trip.trip_id = "trip_1"
    resolver.gtfs_rt_service.get_all_real_time_trip_updates.return_value = [
        mock_trip_update
    ]

    result = resolver.resolve_trip_update(None, None, "trip_1")

    resolver.gtfs_rt_service.get_all_real_time_trip_updates.assert_called_once_with(
        trip_id="trip_1"
    )
    assert result == mock_trip_update


def test_resolve_trip_update_not_found(resolver):
    """Test trip update when none are found"""
    resolver.gtfs_rt_service.get_all_real_time_trip_updates.return_value = []

    result = resolver.resolve_trip_update(None, None, "nonexistent")

    assert result is None


def test_resolve_trip_updates(resolver):
    """Test getting multiple trip updates with filter"""
    trip_updates = [TripUpdate(), TripUpdate()]
    mock_filter = Mock()
    mock_filter.route_id = "1"
    mock_filter.trip_id = "trip_1"

    resolver.gtfs_rt_service.get_all_real_time_trip_updates.return_value = trip_updates

    result = resolver.resolve_trip_updates(None, None, mock_filter)

    resolver.gtfs_rt_service.get_all_real_time_trip_updates.assert_called_once_with(
        "1", "trip_1"
    )
    assert result == trip_updates


# Stop Times Tests
def test_resolve_stop_times(resolver, mock_stop_time):
    """Test getting stop times for a trip"""
    stop_times = [
        mock_stop_time("trip_1", "stop_1"),
        mock_stop_time("trip_1", "stop_2"),
    ]
    resolver.gtfs_service.get_stop_times_by_trip_id.return_value = stop_times

    result = resolver.resolve_stop_times(None, None, "trip_1")

    resolver.gtfs_service.get_stop_times_by_trip_id.assert_called_once_with("trip_1")
    assert result == stop_times


# Search Tests
def test_resolve_search(resolver, mock_stop, mock_route):
    """Test search functionality"""
    stops = [mock_stop("stop_1", "Airport")]
    routes = [mock_route("1", "Airport Flyer")]

    resolver.gtfs_service.get_stops_by_name.return_value = stops
    resolver.gtfs_service.get_routes_by_name.return_value = routes

    result = resolver.resolve_search(None, None, "Airport Flyer")

    resolver.gtfs_service.get_stops_by_name.assert_called_once_with(
        ["Airport", "Flyer"]
    )
    resolver.gtfs_service.get_routes_by_name.assert_called_once_with(
        ["Airport", "Flyer"]
    )
    assert result["stops"] == stops
    assert result["routes"] == routes


# Arrival Times Tests
def test_resolve_arrival_times(resolver, mock_stop_time, mocker):
    """Test resolving arrival times with real-time updates"""
    stop_times = [
        mock_stop_time("trip_1", "stop_1", "10:00:00"),
        mock_stop_time("trip_2", "stop_1", "10:30:00"),
    ]
    resolver.gtfs_service.get_stop_times_by_stop_id.return_value = stop_times

    trip_update = create_trip_update_with_stop("trip_1", "stop_1", 1234567890)
    resolver.gtfs_rt_service.get_real_time_trip_updates.return_value = [trip_update]
    resolver.gtfs_rt_service.get_arrival_time_by_stop_id.return_value = (
        trip_update.stop_time_update[0]
    )

    mock_dt = mocker.Mock()
    mock_dt.astimezone.return_value.strftime.return_value = "10:05:00"
    mocker.patch("server.gql.resolver.datetime").fromtimestamp.return_value = mock_dt
    mocker.patch("server.gql.resolver.timezone")

    result = resolver.resolve_arrival_times(None, None, "stop_1", "2025-01-01")

    resolver.gtfs_service.get_stop_times_by_stop_id.assert_called_once_with(
        "stop_1", "2025-01-01"
    )
    resolver.gtfs_rt_service.get_real_time_trip_updates.assert_called_once_with(
        ["trip_1", "trip_2"]
    )
    assert len(result) == 2
    assert result[0]["scheduled_arrival_time"] == "10:00:00"


def test_resolve_earliest_arrival_times_on_route(resolver, mocker):
    """Test resolving earliest arrival times on a route"""
    mock_arrival_time = Mock()
    mock_arrival_time.arrival_time = "10:00:00"
    mock_arrival_time.stop_id = "stop_1"
    mock_arrival_time.stop_sequence = 1
    mock_arrival_time.trip_id = "trip_1"

    resolver.gtfs_service.get_earliest_arrival_times_on_route.return_value = [
        mock_arrival_time
    ]

    trip_update = create_trip_update_with_stop("trip_1", "stop_1", 1234567890)
    resolver.gtfs_rt_service.get_real_time_trip_updates_on_route.return_value = [
        trip_update
    ]
    resolver.gtfs_rt_service.get_arrival_time_by_stop_id.return_value = (
        trip_update.stop_time_update[0]
    )

    mock_dt = mocker.Mock()
    mock_dt.astimezone.return_value.strftime.return_value = "10:05:00"
    mocker.patch("server.gql.resolver.datetime").fromtimestamp.return_value = mock_dt
    mocker.patch("server.gql.resolver.timezone")

    result = resolver.resolve_earliest_arrival_times_on_route(
        None, None, "1", 0, "2025-01-01", "10:00:00"
    )

    resolver.gtfs_service.get_earliest_arrival_times_on_route.assert_called_once_with(
        "1", 0, "2025-01-01", "10:00:00"
    )
    assert len(result) == 1
    assert result[0]["scheduled_arrival_time"] == "10:00:00"
    assert result[0]["stop_id"] == "stop_1"
    assert result[0]["trip_id"] == "trip_1"


# Feed Info Tests
def test_resolve_feed_info(resolver):
    """Test getting feed info"""
    feed_info_obj = Mock(spec=FeedInfo)
    feed_info_obj.feed_publisher_name = "Capital Metro"
    resolver.gtfs_service.get_feed_info.return_value = feed_info_obj

    result = resolver.resolve_feed_info(None, None)

    resolver.gtfs_service.get_feed_info.assert_called_once()
    assert result == feed_info_obj


# Helper Method Tests
def test_get_updated_arrival_time_with_arrival_field(resolver, mocker):
    """Test _get_updated_arrival_time when arrival field is present"""
    stop_time_update = TripUpdate.StopTimeUpdate()
    stop_time_update.stop_id = "stop_1"
    stop_time_update.arrival.time = 1234567890

    resolver.gtfs_rt_service.get_arrival_time_by_stop_id.return_value = stop_time_update

    mock_dt = mocker.Mock()
    mock_dt.astimezone.return_value.strftime.return_value = "10:05:00"
    mocker.patch("server.gql.resolver.datetime").fromtimestamp.return_value = mock_dt
    mocker.patch("server.gql.resolver.timezone")

    result = resolver._get_updated_arrival_time("stop_1", [])

    assert result == "10:05:00"


def test_get_updated_arrival_time_with_departure_field(resolver, mocker):
    """Test _get_updated_arrival_time when only departure field is present"""
    stop_time_update = TripUpdate.StopTimeUpdate()
    stop_time_update.stop_id = "stop_1"
    stop_time_update.departure.time = 1234567890

    resolver.gtfs_rt_service.get_arrival_time_by_stop_id.return_value = stop_time_update

    mock_dt = mocker.Mock()
    mock_dt.astimezone.return_value.strftime.return_value = "10:05:00"
    mocker.patch("server.gql.resolver.datetime").fromtimestamp.return_value = mock_dt
    mocker.patch("server.gql.resolver.timezone")

    result = resolver._get_updated_arrival_time("stop_1", [])

    assert result == "10:05:00"


def test_get_updated_arrival_time_not_found(resolver):
    """Test _get_updated_arrival_time when stop is not found"""
    resolver.gtfs_rt_service.get_arrival_time_by_stop_id.return_value = None

    result = resolver._get_updated_arrival_time("stop_1", [])

    assert result is None


def test_get_updated_arrival_time_skipped_stop(resolver):
    """Test _get_updated_arrival_time when stop is skipped (schedule_relationship=1)"""
    stop_time_update = TripUpdate.StopTimeUpdate()
    stop_time_update.stop_id = "stop_1"
    stop_time_update.schedule_relationship = 1  # SKIPPED

    resolver.gtfs_rt_service.get_arrival_time_by_stop_id.return_value = stop_time_update

    result = resolver._get_updated_arrival_time("stop_1", [])

    assert result is None


def test_get_earliest_updated_arrival_time(resolver, mocker):
    """Test _get_earliest_updated_arrival_time finds the earliest time"""
    mock_get_updated = mocker.patch.object(resolver, "_get_updated_arrival_time")
    mock_get_updated.side_effect = ["10:30:00", "10:15:00", "10:45:00"]

    result = resolver._get_earliest_updated_arrival_time("stop_1", [[], [], []])

    assert result == "10:15:00"
    assert mock_get_updated.call_count == 3


def test_get_earliest_updated_arrival_time_with_none_values(resolver, mocker):
    """Test _get_earliest_updated_arrival_time with some None values"""
    mock_get_updated = mocker.patch.object(resolver, "_get_updated_arrival_time")
    mock_get_updated.side_effect = [None, "10:30:00", None, "10:15:00"]

    result = resolver._get_earliest_updated_arrival_time("stop_1", [[], [], [], []])

    assert result == "10:15:00"


def test_get_earliest_updated_arrival_time_all_none(resolver, mocker):
    """Test _get_earliest_updated_arrival_time when all values are None"""
    mock_get_updated = mocker.patch.object(resolver, "_get_updated_arrival_time")
    mock_get_updated.return_value = None

    result = resolver._get_earliest_updated_arrival_time("stop_1", [[]])

    assert result is None
