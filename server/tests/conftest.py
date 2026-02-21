import pytest
from unittest.mock import Mock
from server.services.gtfs_service import GTFSService
from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_rt_client import GTFSRTClient
from server.gql.resolver import Resolver
from server.models.gtfs_models import Routes, Stops, Trips, StopTimes, FeedInfo


@pytest.fixture
def gtfs_service():
    return GTFSService()


@pytest.fixture
def gtfs_rt_client():
    return Mock(spec=GTFSRTClient)


@pytest.fixture
def gtfs_rt_service(gtfs_rt_client):
    return GTFSRTService(gtfs_rt_client)


@pytest.fixture
def mock_gtfs_service():
    return Mock(spec=GTFSService)


@pytest.fixture
def mock_gtfs_rt_service():
    return Mock(spec=GTFSRTService)


@pytest.fixture
def resolver(mock_gtfs_service, mock_gtfs_rt_service):
    res = Resolver(gtfs_service=mock_gtfs_service)
    res.gtfs_rt_service = mock_gtfs_rt_service
    return res


@pytest.fixture
def mock_route():
    def _create(route_id="1", short_name="1"):
        route = Mock(spec=Routes)
        route.route_id = route_id
        route.route_short_name = short_name
        route.route_long_name = f"Route {short_name}"
        return route

    return _create


@pytest.fixture
def mock_stop():
    def _create(stop_id="stop_1", name="Test Stop"):
        stop = Mock(spec=Stops)
        stop.stop_id = stop_id
        stop.stop_name = name
        stop.stop_code = f"CODE_{stop_id}"
        stop.stop_time = Mock()
        stop.stop_time.stop_sequence = 1
        stop.stop_time.trip = Mock()
        stop.stop_time.trip.shape_id = "shape_1"
        return stop

    return _create


@pytest.fixture
def mock_trip():
    def _create(trip_id="trip_1", route_id="1", shape_id="shape_1"):
        trip = Mock(spec=Trips)
        trip.trip_id = trip_id
        trip.route_id = route_id
        trip.shape_id = shape_id
        trip.direction_id = 0
        trip.trip_headsign = "Downtown"
        return trip

    return _create


@pytest.fixture
def mock_stop_time():
    def _create(trip_id="trip_1", stop_id="stop_1", arrival_time="10:00:00"):
        stop_time = Mock(spec=StopTimes)
        stop_time.trip_id = trip_id
        stop_time.stop_id = stop_id
        stop_time.arrival_time = arrival_time
        stop_time.stop_sequence = 1
        stop_time.trip = Mock()
        stop_time.trip.trip_id = trip_id
        return stop_time

    return _create
