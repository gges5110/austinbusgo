from unittest.mock import AsyncMock, MagicMock

import pytest

from server.services.gtfs_rt_client import GTFSRTClient
from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_service import GTFSService


@pytest.fixture
def mock_session():
    return MagicMock()


@pytest.fixture
def gtfs_service(mock_session):
    return GTFSService(mock_session)


@pytest.fixture
def gtfs_rt_client():
    return MagicMock(spec=GTFSRTClient)


@pytest.fixture
def gtfs_rt_service(mock_session, gtfs_rt_client):
    svc = GTFSService(mock_session)
    return GTFSRTService(svc, gtfs_rt_client)


@pytest.fixture
def mock_gtfs_service():
    svc = AsyncMock(spec=GTFSService)
    svc.session = MagicMock()
    return svc


@pytest.fixture
def mock_gtfs_rt_service():
    return MagicMock(spec=GTFSRTService)


@pytest.fixture
def mock_route():
    def _create(route_id="1", short_name="1"):
        r = MagicMock()
        r.route_id = route_id
        r.route_short_name = short_name
        r.route_long_name = f"Route {short_name}"
        r.agency_id = None
        r.route_color = None
        return r

    return _create


@pytest.fixture
def mock_stop():
    def _create(stop_id="stop_1", name="Test Stop"):
        s = MagicMock()
        s.stop_id = stop_id
        s.stop_name = name
        s.stop_code = f"CODE_{stop_id}"
        s.stop_loc = None
        s.stop_time = MagicMock()
        s.stop_time.stop_sequence = 1
        s.stop_time.trip = MagicMock()
        s.stop_time.trip.shape_id = "shape_1"
        return s

    return _create


@pytest.fixture
def mock_trip():
    def _create(trip_id="trip_1", route_id="1", shape_id="shape_1"):
        t = MagicMock()
        t.trip_id = trip_id
        t.route_id = route_id
        t.shape_id = shape_id
        t.direction_id = 0
        t.trip_headsign = "Downtown"
        t.service_id = "service_1"
        t.block_id = None
        t.scheduled_trip_id = None
        t.trip_short_name = None
        t.wheelchair_accessible = None
        t.bikes_allowed = None
        return t

    return _create


@pytest.fixture
def mock_stop_time():
    def _create(trip_id="trip_1", stop_id="stop_1", arrival_time="10:00:00"):
        st = MagicMock()
        st.trip_id = trip_id
        st.stop_id = stop_id
        st.arrival_time = arrival_time
        st.stop_sequence = 1
        st.departure_time = arrival_time
        st.trip = MagicMock()
        st.trip.trip_id = trip_id
        return st

    return _create
