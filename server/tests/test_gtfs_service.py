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

    result = await svc.get_routes_by_name("Airport")

    session.execute.assert_called_once()
    assert len(result) == 1


@pytest.mark.asyncio
async def test_get_routes_by_name_multi_word_phrase():
    svc, session = make_service()
    routes = [SimpleNamespace(route_id="1"), SimpleNamespace(route_id="2")]
    session.execute.return_value = make_exec_result(routes)

    result = await svc.get_routes_by_name("Martin Luther")

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


@pytest.mark.asyncio
async def test_get_routes_at_stops():
    svc, session = make_service()
    route1 = SimpleNamespace(route_id="1")
    route2 = SimpleNamespace(route_id="2")
    exec_result = MagicMock()
    exec_result.all.return_value = [
        ("stop_1", route1),
        ("stop_1", route2),
        ("stop_2", route2),
    ]
    session.execute.return_value = exec_result

    result = await svc.get_routes_at_stops(["stop_1", "stop_2", "stop_3"])

    session.execute.assert_called_once()
    assert result["stop_1"] == [route1, route2]
    assert result["stop_2"] == [route2]
    # Stops with no routes still get an entry so the dataloader keeps order
    assert result["stop_3"] == []


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

    result = await svc.get_stops_by_name("Airport")

    assert len(result) == 1
    assert result[0].stop_id == "stop_1"


# 1 degree of latitude in meters (haversine, mean Earth radius)
METERS_PER_DEGREE_LAT = 111195.08


def make_nearby_row(stop_id, meters_north_of_center):
    """A stop row due north of the (30.5, -97.5) bounding-box center."""
    return SimpleNamespace(
        stop_id=stop_id,
        stop_code=None,
        stop_name=f"Stop {stop_id}",
        stop_loc=None,
        stop_lat=30.5 + meters_north_of_center / METERS_PER_DEGREE_LAT,
        stop_lon=-97.5,
    )


def make_all_result(rows):
    result = MagicMock()
    result.all.return_value = rows
    return result


NEARBY_BOX = dict(min_lat=30.0, min_lon=-98.0, max_lat=31.0, max_lon=-97.0)


@pytest.mark.asyncio
async def test_get_near_by_stops_queries_route_counts_without_cache():
    svc, session = make_service()
    session.execute.side_effect = [
        make_all_result([make_nearby_row("stop_1", 100)]),
        make_all_result([("stop_1", 2)]),
    ]

    result = await svc.get_near_by_stops(**NEARBY_BOX)

    assert session.execute.call_count == 2
    assert len(result) == 1
    assert result[0].route_count == 2


@pytest.mark.asyncio
async def test_get_near_by_stops_empty():
    svc, session = make_service()
    session.execute.side_effect = [make_all_result([]), make_all_result([])]

    result = await svc.get_near_by_stops(**NEARBY_BOX)

    assert result == []


@pytest.mark.asyncio
async def test_get_near_by_stops_with_route_counts_cache():
    """Ranks by route count over distance from the box center."""
    svc, session = make_service()
    # stop_1 has more routes but stop_2 is closer
    session.execute.return_value = make_all_result(
        [make_nearby_row("stop_1", 500), make_nearby_row("stop_2", 100)]
    )

    result = await svc.get_near_by_stops(
        **NEARBY_BOX, route_counts={"stop_1": 3, "stop_2": 1}
    )

    session.execute.assert_called_once()
    # stop_1: score = (3+1)/(500*10+1) = 4/5001 ≈ 0.000799
    # stop_2: score = (1+1)/(100*10+1) = 2/1001 ≈ 0.001998  → stop_2 ranks first
    assert [s.stop_id for s in result] == ["stop_2", "stop_1"]
    assert [s.route_count for s in result] == [1, 3]


@pytest.mark.asyncio
async def test_get_near_by_stops_with_route_counts_cache_respects_limit():
    svc, session = make_service()
    session.execute.return_value = make_all_result(
        [make_nearby_row(f"stop_{i}", (i + 1) * 100) for i in range(5)]
    )

    result = await svc.get_near_by_stops(**NEARBY_BOX, limit=3, route_counts={})

    assert [s.stop_id for s in result] == ["stop_0", "stop_1", "stop_2"]


@pytest.mark.asyncio
async def test_get_all_routes_at_stops():
    svc, session = make_service()

    row1 = MagicMock()
    row1.stop_id = "stop_1"
    row1.route_id = "1"
    row1.agency_id = None
    row1.route_short_name = "1"
    row1.route_long_name = "Route 1"
    row1.route_color = "FF0000"

    row2 = MagicMock()
    row2.stop_id = "stop_1"
    row2.route_id = "2"
    row2.agency_id = None
    row2.route_short_name = "2"
    row2.route_long_name = "Route 2"
    row2.route_color = None

    row3 = MagicMock()
    row3.stop_id = "stop_2"
    row3.route_id = "1"
    row3.agency_id = None
    row3.route_short_name = "1"
    row3.route_long_name = "Route 1"
    row3.route_color = "FF0000"

    result_mock = MagicMock()
    result_mock.__iter__ = MagicMock(return_value=iter([row1, row2, row3]))
    session.execute.return_value = result_mock

    cache = await svc.get_all_routes_at_stops()

    session.execute.assert_called_once()
    assert len(cache) == 2
    assert len(cache["stop_1"]) == 2
    assert len(cache["stop_2"]) == 1
    assert cache["stop_1"][0].route_id == "1"
    assert cache["stop_2"][0].route_id == "1"


def make_route_stop_row(stop_id, shape_id, stop_sequence, trip_count):
    return SimpleNamespace(
        stop_id=stop_id,
        stop_code=None,
        stop_name=f"Stop {stop_id}",
        stop_loc=None,
        shape_id=shape_id,
        stop_sequence=stop_sequence,
        trip_count=trip_count,
    )


@pytest.mark.asyncio
async def test_get_stops_by_route_id():
    svc, session = make_service()
    session.execute.return_value = make_exec_result(
        [make_route_stop_row("stop_1", "shape_1", 1, 10)]
    )

    result = await svc.get_stops_by_route_id("1", 0)

    assert len(result) == 1
    assert result[0].stop_id == "stop_1"
    assert result[0].stop_time.stop_sequence == 1
    assert result[0].stop_time.trip.shape_id == "shape_1"


@pytest.mark.asyncio
async def test_get_stops_by_route_id_picks_most_common_shape_per_stop():
    svc, session = make_service()
    # Rows arrive ordered by (stop_id, shape_id), one per pair
    session.execute.return_value = make_exec_result(
        [
            make_route_stop_row("stop_1", "shape_a", 3, 2),
            make_route_stop_row("stop_1", "shape_b", 2, 40),
            make_route_stop_row("stop_1", "shape_c", 4, 40),
            make_route_stop_row("stop_2", "shape_z", 7, 5),
        ]
    )

    result = await svc.get_stops_by_route_id("1", 0)

    by_id = {s.stop_id: s for s in result}
    assert set(by_id) == {"stop_1", "stop_2"}
    # Most trips; ties keep the lowest shape_id
    assert by_id["stop_1"].stop_time.trip.shape_id == "shape_b"
    # Lowest sequence across all shapes
    assert by_id["stop_1"].stop_time.stop_sequence == 2
    assert by_id["stop_2"].stop_time.trip.shape_id == "shape_z"


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

    result = await svc.get_trips_by_distinct_short_name("1", "20250101")

    assert len(result) == 1


@pytest.mark.asyncio
async def test_get_trips_for_date():
    svc, session = make_service()
    trip = SimpleNamespace(trip_id="trip_1")
    session.execute.return_value = make_exec_result([trip])

    result = await svc.get_trips_for_date("1", "20250101")

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

    result = await svc.get_stop_times_by_stop_id("stop_1", "20250101")

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
        "1", 0, "20250101", "10:00:00"
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
