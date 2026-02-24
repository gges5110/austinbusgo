import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from server.services.gtfs_service import GTFSService


def make_service():
    session = AsyncMock()
    return GTFSService(session), session


def make_exec_result(rows):
    result = MagicMock()
    result.__iter__ = MagicMock(return_value=iter(rows))
    scalars = MagicMock()
    scalars.all.return_value = rows
    result.scalars.return_value = scalars
    result.scalar_one.return_value = rows[0] if rows else None
    result.one.return_value = rows[0] if rows else None
    return result


# Route Tests
@pytest.mark.asyncio
async def test_get_route():
    svc, session = make_service()
    mock_route = SimpleNamespace(
        route_id="1",
        route_long_name="Test",
        route_short_name="1",
        agency_id=None,
        route_color=None,
    )
    session.execute.return_value = make_exec_result([mock_route])

    result = await svc.get_route("1")

    session.execute.assert_called_once()
    assert result == mock_route


@pytest.mark.asyncio
async def test_get_routes():
    svc, session = make_service()
    routes = [SimpleNamespace(route_id="1"), SimpleNamespace(route_id="2")]
    session.execute.return_value = make_exec_result(routes)

    result = await svc.get_routes()

    assert len(result) == 2


@pytest.mark.asyncio
async def test_get_routes_by_name():
    svc, session = make_service()
    routes = [SimpleNamespace(route_id="1")]
    session.execute.return_value = make_exec_result(routes)

    result = await svc.get_routes_by_name(["Airport"])

    session.execute.assert_called_once()
    assert len(result) == 1


@pytest.mark.asyncio
async def test_get_routes_by_name_multiple_terms():
    svc, session = make_service()
    routes = [SimpleNamespace(route_id="1"), SimpleNamespace(route_id="2")]
    session.execute.return_value = make_exec_result(routes)

    result = await svc.get_routes_by_name(["Martin", "Luther"])

    session.execute.assert_called_once()
    assert len(result) == 2


@pytest.mark.asyncio
async def test_get_routes_at_stop():
    svc, session = make_service()
    routes = [SimpleNamespace(route_id="1")]
    session.execute.return_value = make_exec_result(routes)

    result = await svc.get_routes_at_stop("stop_1")

    session.execute.assert_called_once()
    assert len(result) == 1


# Stop Tests
@pytest.mark.asyncio
async def test_get_stop():
    svc, session = make_service()
    row = MagicMock()
    row._mapping = {
        "stop_id": "stop_1",
        "stop_code": "CODE",
        "stop_name": "Test Stop",
        "stop_desc": None,
        "stop_loc": None,
        "zone_id": None,
        "stop_url": None,
        "location_type": None,
        "parent_station": None,
        "stop_timezone": None,
        "wheelchair_boarding": None,
        "corner_placement": None,
        "stop_position": None,
        "on_street": None,
        "at_street": None,
        "heading": None,
    }
    result_mock = MagicMock()
    result_mock.one.return_value = row
    session.execute.return_value = result_mock

    result = await svc.get_stop("stop_1")

    assert result.stop_id == "stop_1"


@pytest.mark.asyncio
async def test_get_stops_by_name():
    svc, session = make_service()
    row = MagicMock()
    row._mapping = {
        "stop_id": "stop_1",
        "stop_code": "CODE",
        "stop_name": "Airport",
        "stop_loc": None,
    }
    result_mock = MagicMock()
    result_mock.__iter__ = MagicMock(return_value=iter([row]))
    session.execute.return_value = result_mock

    result = await svc.get_stops_by_name(["Airport"])

    assert len(result) == 1
    assert result[0].stop_id == "stop_1"


@pytest.mark.asyncio
async def test_get_near_by_stops():
    svc, session = make_service()
    row = MagicMock()
    row._mapping = {
        "stop_id": "stop_1",
        "stop_code": None,
        "stop_name": "Stop",
        "stop_loc": None,
        "route_count": 1,
    }
    result_mock = MagicMock()
    result_mock.__iter__ = MagicMock(return_value=iter([row]))
    session.execute.return_value = result_mock

    result = await svc.get_near_by_stops(
        min_lat=30.0, min_lon=-98.0, max_lat=31.0, max_lon=-97.0
    )

    session.execute.assert_called_once()
    assert len(result) == 1


@pytest.mark.asyncio
async def test_get_near_by_stops_empty():
    svc, session = make_service()
    result_mock = MagicMock()
    result_mock.__iter__ = MagicMock(return_value=iter([]))
    session.execute.return_value = result_mock

    result = await svc.get_near_by_stops(
        min_lat=30.0, min_lon=-98.0, max_lat=31.0, max_lon=-97.0
    )

    session.execute.assert_called_once()
    assert result == []


@pytest.mark.asyncio
async def test_get_stops_by_route_id():
    svc, session = make_service()
    row = MagicMock()
    row.stop_id = "stop_1"
    row.stop_code = None
    row.stop_name = "Stop"
    row.stop_loc = None
    row.st_stop_sequence = 1
    row.t_shape_id = "shape_1"
    result_mock = MagicMock()
    result_mock.__iter__ = MagicMock(return_value=iter([row]))
    session.execute.return_value = result_mock

    result = await svc.get_stops_by_route_id("1", 0)

    assert len(result) == 1
    assert result[0].stop_id == "stop_1"
    assert result[0].stop_time.stop_sequence == 1
    assert result[0].stop_time.trip.shape_id == "shape_1"


# Trip Tests
@pytest.mark.asyncio
async def test_get_trips_by_distinct_short_name():
    svc, session = make_service()
    row = MagicMock()
    row._mapping = {
        "trip_id": "trip_1",
        "route_id": "1",
        "service_id": "svc1",
        "trip_headsign": "Downtown",
        "direction_id": 0,
        "block_id": None,
        "shape_id": "shape_1",
        "scheduled_trip_id": None,
        "trip_short_name": None,
        "wheelchair_accessible": None,
        "bikes_allowed": None,
    }
    result_mock = MagicMock()
    result_mock.__iter__ = MagicMock(return_value=iter([row]))
    session.execute.return_value = result_mock

    result = await svc.get_trips_by_distinct_short_name("1", "2025-01-01")

    assert len(result) == 1


@pytest.mark.asyncio
async def test_get_trips_for_date():
    svc, session = make_service()
    trip = SimpleNamespace(trip_id="trip_1")
    session.execute.return_value = make_exec_result([trip])

    result = await svc.get_trips_for_date("1", "2025-01-01")

    session.execute.assert_called_once()
    assert len(result) == 1


@pytest.mark.asyncio
async def test_get_trips_with_direction_and_route():
    svc, session = make_service()
    result_mock = MagicMock()
    result_mock.__iter__ = MagicMock(return_value=iter([("trip_1",), ("trip_2",)]))
    session.execute.return_value = result_mock

    result = await svc.get_trips_with_direction_and_route(
        ["trip_1", "trip_2", "trip_3"], "1", 0
    )

    assert result == ["trip_1", "trip_2"]


@pytest.mark.asyncio
async def test_get_trip_by_id():
    svc, session = make_service()
    row = MagicMock()
    row.trip_id = "trip_1"
    row.route_id = "1"
    row.service_id = "svc1"
    row.trip_headsign = "Downtown"
    row.direction_id = 0
    row.block_id = None
    row.shape_id = "shape_1"
    row.scheduled_trip_id = None
    row.trip_short_name = None
    row.wheelchair_accessible = None
    row.bikes_allowed = None
    row.r_route_id = "1"
    row.route_short_name = "1"
    row.route_long_name = "Route 1"
    row.agency_id = None
    row.route_color = None
    result_mock = MagicMock()
    result_mock.one.return_value = row
    session.execute.return_value = result_mock

    result = await svc.get_trip_by_id("trip_1")

    assert result.trip_id == "trip_1"
    assert result.route.route_id == "1"


# Shape Tests
@pytest.mark.asyncio
async def test_get_shapes_by_shape_id():
    svc, session = make_service()
    row = MagicMock()
    row.shape_id = "shape_1"
    row.shape = '{"type":"LineString","coordinates":[[0,0],[1,1]]}'
    result_mock = MagicMock()
    result_mock.one.return_value = row
    session.execute.return_value = result_mock

    result = await svc.get_shapes_by_shape_id("shape_1")

    assert result.shape_id == "shape_1"


@pytest.mark.asyncio
async def test_get_shapes_by_trip_id():
    svc, session = make_service()
    # First call: get shape_id from trips
    shape_id_result = MagicMock()
    shape_id_result.scalar_one.return_value = "shape_1"
    # Second call: get aggregated shape
    shape_row = MagicMock()
    shape_row.shape_id = "shape_1"
    shape_row.shape = '{"type":"LineString","coordinates":[[0,0],[1,1]]}'
    shape_result = MagicMock()
    shape_result.one.return_value = shape_row
    session.execute.side_effect = [shape_id_result, shape_result]

    result = await svc.get_shapes_by_trip_id("trip_1")

    assert result.shape_id == "shape_1"


# StopTimes Tests
@pytest.mark.asyncio
async def test_get_stop_times_by_trip_id():
    svc, session = make_service()
    row = MagicMock()
    row.trip_id = "trip_1"
    row.arrival_time = "10:00:00"
    row.departure_time = "10:01:00"
    row.stop_id = "stop_1"
    row.stop_sequence = 1
    row.pickup_type = None
    row.drop_off_type = None
    row.shape_dist_traveled = None
    row.timepoint = None
    row.s_stop_id = "stop_1"
    row.stop_code = None
    row.stop_name = "Stop 1"
    row.stop_loc = None
    result_mock = MagicMock()
    result_mock.__iter__ = MagicMock(return_value=iter([row]))
    session.execute.return_value = result_mock

    result = await svc.get_stop_times_by_trip_id("trip_1")

    assert len(result) == 1
    assert result[0].trip_id == "trip_1"
    assert result[0].stop.stop_id == "stop_1"


@pytest.mark.asyncio
async def test_get_stop_times_by_stop_id():
    svc, session = make_service()
    row = MagicMock()
    row.trip_id = "trip_1"
    row.arrival_time = "10:00:00"
    row.departure_time = "10:01:00"
    row.stop_id = "stop_1"
    row.stop_sequence = 1
    row.t_trip_id = "trip_1"
    row.route_id = "1"
    row.service_id = "svc1"
    row.trip_headsign = "Downtown"
    row.direction_id = 0
    row.block_id = None
    row.shape_id = "shape_1"
    row.scheduled_trip_id = None
    row.trip_short_name = None
    row.wheelchair_accessible = None
    row.bikes_allowed = None
    row.r_route_id = "1"
    row.route_short_name = "1"
    row.route_long_name = "Route 1"
    row.agency_id = None
    row.route_color = None
    result_mock = MagicMock()
    result_mock.__iter__ = MagicMock(return_value=iter([row]))
    session.execute.return_value = result_mock

    result = await svc.get_stop_times_by_stop_id("stop_1", "2025-01-01")

    assert len(result) == 1
    assert result[0].trip.trip_id == "trip_1"
    assert result[0].trip.route.route_id == "1"


@pytest.mark.asyncio
async def test_get_earliest_arrival_times_on_route():
    svc, session = make_service()
    row = MagicMock()
    row._mapping = {
        "arrival_time": "10:00:00",
        "stop_id": "stop_1",
        "stop_sequence": 1,
        "trip_id": "trip_1",
    }
    result_mock = MagicMock()
    result_mock.__iter__ = MagicMock(return_value=iter([row]))
    session.execute.return_value = result_mock

    result = await svc.get_earliest_arrival_times_on_route(
        "1", 0, "2025-01-01", "10:00:00"
    )

    assert len(result) == 1
    assert result[0].stop_id == "stop_1"


# FeedInfo Tests
@pytest.mark.asyncio
async def test_get_feed_info():
    svc, session = make_service()
    from server.models.gtfs_models import FeedInfo

    row = MagicMock(spec=FeedInfo)
    row.feed_publisher_name = "Capital Metro"
    row.feed_publisher_url = "http://example.com"
    row.feed_lang = "en"
    row.feed_start_date = None
    row.feed_end_date = None
    row.feed_version = "1.0"
    session.execute.return_value = make_exec_result([row])

    result = await svc.get_feed_info()

    assert result.feed_publisher_name == "Capital Metro"
