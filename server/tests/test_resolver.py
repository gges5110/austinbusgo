import pytest
from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate
from pytz import timezone

from server.gql.resolver import Resolver
from server.services.gtfs_service import GTFSService
from server.services.gtfs_rt_service import GTFSRTService


def create_trip_update_with_stop(
    trip_id: str, stop_id: str, arrival_time: int = None
) -> TripUpdate:
    tu = TripUpdate()
    tu.trip.trip_id = trip_id
    stu = tu.stop_time_update.add()
    stu.stop_id = stop_id
    if arrival_time:
        stu.arrival.time = arrival_time
    return tu


def make_resolver():
    session = MagicMock()
    gtfs_service = AsyncMock(spec=GTFSService)
    gtfs_service.session = session
    gtfs_rt_service = MagicMock(spec=GTFSRTService)
    res = Resolver(session=session, gtfs_service=gtfs_service)
    # Set gtfs_rt_service on all feature resolvers
    res.gtfs_rt_service = gtfs_rt_service
    res.routes.gtfs_rt_service = gtfs_rt_service
    res.stops.gtfs_rt_service = gtfs_rt_service
    res.trips.gtfs_rt_service = gtfs_rt_service
    res.real_time.gtfs_rt_service = gtfs_rt_service
    res.search.gtfs_rt_service = gtfs_rt_service
    res.arrivals.gtfs_rt_service = gtfs_rt_service
    return res, gtfs_service, gtfs_rt_service


# Trip Tests
@pytest.mark.asyncio
async def test_resolve_trip():
    resolver, gtfs_service, _ = make_resolver()
    trip = SimpleNamespace(
        trip_id="trip_1",
        route_id="1",
        service_id="svc1",
        trip_headsign="Downtown",
        direction_id=0,
        block_id=None,
        shape_id="shape_1",
        scheduled_trip_id=None,
        trip_short_name=None,
        wheelchair_accessible=None,
        bikes_allowed=None,
        route=None,
    )
    gtfs_service.get_trip_by_id.return_value = trip

    result = await resolver.trips.resolve_trip("trip_1")

    gtfs_service.get_trip_by_id.assert_called_once_with("trip_1")
    assert result == trip


@pytest.mark.asyncio
async def test_resolve_distinct_trips():
    resolver, gtfs_service, _ = make_resolver()
    trips = [SimpleNamespace(trip_id="trip_1"), SimpleNamespace(trip_id="trip_2")]
    gtfs_service.get_trips_by_distinct_short_name.return_value = trips

    result = await resolver.trips.resolve_distinct_trips("1", "2025-01-01")

    assert result == trips


@pytest.mark.asyncio
async def test_resolve_trip_ids_for_route():
    resolver, gtfs_service, _ = make_resolver()
    trips = [SimpleNamespace(trip_id="trip_1"), SimpleNamespace(trip_id="trip_2")]
    gtfs_service.get_trips_for_date.return_value = trips

    result = await resolver.trips.resolve_trip_ids_for_route("1", "2025-01-01")

    assert result.trip_ids == ["trip_1", "trip_2"]


# Stop Tests
@pytest.mark.asyncio
async def test_resolve_stop():
    resolver, gtfs_service, _ = make_resolver()
    stop = SimpleNamespace(
        stop_id="stop_1", stop_name="Test", stop_code=None, stop_loc=None
    )
    gtfs_service.get_stop.return_value = stop

    result = await resolver.stops.resolve_stop("stop_1")

    gtfs_service.get_stop.assert_called_once_with("stop_1")
    assert result == stop


@pytest.mark.asyncio
async def test_resolve_near_by_stops():
    resolver, gtfs_service, _ = make_resolver()
    stops = [SimpleNamespace(stop_id="stop_1"), SimpleNamespace(stop_id="stop_2")]
    gtfs_service.get_near_by_stops.return_value = stops

    result = await resolver.stops.resolve_near_by_stops(
        min_lat=30.0, min_lon=-98.0, max_lat=31.0, max_lon=-97.0
    )

    gtfs_service.get_near_by_stops.assert_called_once_with(
        min_lat=30.0,
        min_lon=-98.0,
        max_lat=31.0,
        max_lon=-97.0,
        limit=20,
        route_counts=None,
    )
    assert result == stops


@pytest.mark.asyncio
async def test_resolve_near_by_stops_empty():
    resolver, gtfs_service, _ = make_resolver()
    gtfs_service.get_near_by_stops.return_value = None

    result = await resolver.stops.resolve_near_by_stops(
        min_lat=30.0, min_lon=-98.0, max_lat=31.0, max_lon=-97.0
    )

    assert result == []


@pytest.mark.asyncio
async def test_resolve_stops_by_name():
    resolver, gtfs_service, _ = make_resolver()
    stops = [SimpleNamespace(stop_id="stop_1")]
    gtfs_service.get_stops_by_name.return_value = stops

    result = await resolver.stops.resolve_stops_by_name("Airport")

    assert result == stops


@pytest.mark.asyncio
async def test_resolve_stops_and_shapes():
    resolver, gtfs_service, _ = make_resolver()
    stop1 = SimpleNamespace(
        stop_id="stop_1",
        stop_time=SimpleNamespace(
            stop_sequence=2, trip=SimpleNamespace(shape_id="shape_1")
        ),
    )
    stop2 = SimpleNamespace(
        stop_id="stop_2",
        stop_time=SimpleNamespace(
            stop_sequence=1, trip=SimpleNamespace(shape_id="shape_1")
        ),
    )
    gtfs_service.get_stops_by_route_id.return_value = [stop1, stop2]
    gtfs_service.get_shapes_by_shape_id.return_value = SimpleNamespace(
        shape_id="shape_1", shape='{"type":"LineString","coordinates":[[0,0],[1,1]]}'
    )

    result = await resolver.stops.resolve_stops_and_shapes("1", 0, "2025-01-01")

    assert len(result.stops) == 2
    assert result.stops[0].stop_id == "stop_2"  # sorted by sequence
    assert len(result.shapes) == 1


# Route Tests
@pytest.mark.asyncio
async def test_resolve_route():
    resolver, gtfs_service, _ = make_resolver()
    route = SimpleNamespace(
        route_id="1",
        route_long_name="Test Route",
        route_short_name="1",
        agency_id=None,
        route_color=None,
    )
    gtfs_service.get_route.return_value = route

    result = await resolver.routes.resolve_route("1")

    gtfs_service.get_route.assert_called_once_with("1")
    assert result == route


@pytest.mark.asyncio
async def test_resolve_routes():
    resolver, gtfs_service, _ = make_resolver()
    routes = [SimpleNamespace(route_id="1"), SimpleNamespace(route_id="2")]
    gtfs_service.get_routes.return_value = routes

    result = await resolver.routes.resolve_routes()

    assert result == routes


@pytest.mark.asyncio
async def test_resolve_route_shapes():
    resolver, gtfs_service, _ = make_resolver()
    agg = SimpleNamespace(
        shape_id="shape_1", shape='{"type":"LineString","coordinates":[[0,0],[1,1]]}'
    )
    gtfs_service.get_shapes_by_trip_id.return_value = agg

    result = await resolver.routes.resolve_route_shapes("trip_1")

    gtfs_service.get_shapes_by_trip_id.assert_called_once_with("trip_1")
    assert result.type.value == "LineString"
    assert len(result.coordinates) == 2


# Real-time Tests
@pytest.mark.asyncio
async def test_resolve_vehicle_positions():
    resolver, _, gtfs_rt_service = make_resolver()
    positions = [VehiclePosition(), VehiclePosition()]
    gtfs_rt_service.get_real_time_vehicle_positions_on_route = AsyncMock(
        return_value=positions
    )

    result = await resolver.real_time.resolve_vehicle_positions("1", 0)

    # Result is converted from protos to Strawberry types
    assert len(result) == 2


def test_resolve_vehicle_positions_debug():
    resolver, _, gtfs_rt_service = make_resolver()
    positions = [VehiclePosition(), VehiclePosition()]
    gtfs_rt_service.get_real_time_vehicle_positions.return_value = positions

    result = resolver.real_time.resolve_vehicle_positions_debug()

    # Result is converted from protos to Strawberry types
    assert len(result) == 2


def test_resolve_trip_update():
    resolver, _, gtfs_rt_service = make_resolver()
    tu = TripUpdate()
    tu.trip.trip_id = "trip_1"
    gtfs_rt_service.get_all_real_time_trip_updates.return_value = [tu]

    result = resolver.real_time.resolve_trip_update("trip_1")

    # Result is converted from proto to Strawberry type
    assert result is not None
    assert result.trip.trip_id == "trip_1"


def test_resolve_trip_update_not_found():
    resolver, _, gtfs_rt_service = make_resolver()
    gtfs_rt_service.get_all_real_time_trip_updates.return_value = []

    result = resolver.real_time.resolve_trip_update("nonexistent")

    assert result is None


def test_resolve_trip_updates():
    resolver, _, gtfs_rt_service = make_resolver()
    trip_updates = [TripUpdate(), TripUpdate()]
    mock_filter = MagicMock()
    mock_filter.route_id = "1"
    mock_filter.trip_id = "trip_1"
    gtfs_rt_service.get_all_real_time_trip_updates.return_value = trip_updates

    result = resolver.real_time.resolve_trip_updates(route_id="1", trip_id="trip_1")

    # Result is converted from protos to Strawberry types
    assert len(result) == 2


# Stop Times Tests
@pytest.mark.asyncio
async def test_resolve_stop_times():
    resolver, gtfs_service, _ = make_resolver()
    stop_times = [
        SimpleNamespace(
            trip_id="trip_1",
            stop_id="stop_1",
            arrival_time="10:00:00",
            departure_time="10:01:00",
            stop_sequence=1,
            stop=None,
            trip=None,
            pickup_type=None,
            drop_off_type=None,
            shape_dist_traveled=None,
            timepoint=None,
        ),
    ]
    gtfs_service.get_stop_times_by_trip_id.return_value = stop_times

    result = await resolver.trips.resolve_stop_times("trip_1")

    gtfs_service.get_stop_times_by_trip_id.assert_called_once_with("trip_1")
    assert result == stop_times


# Search Tests
@pytest.mark.asyncio
async def test_resolve_search():
    resolver, gtfs_service, _ = make_resolver()
    stops = [SimpleNamespace(stop_id="stop_1")]
    routes = [SimpleNamespace(route_id="1")]
    gtfs_service.get_stops_by_name.return_value = stops
    gtfs_service.get_routes_by_name.return_value = routes

    result = await resolver.search.resolve_search("Airport Flyer")

    gtfs_service.get_stops_by_name.assert_called_once_with("Airport Flyer", limit=8)
    gtfs_service.get_routes_by_name.assert_called_once_with("Airport Flyer", limit=8)
    assert result.stops == stops
    assert result.routes == routes


# Arrival Times Tests
@pytest.mark.asyncio
async def test_resolve_arrival_times(mocker):
    resolver, gtfs_service, gtfs_rt_service = make_resolver()
    trip = SimpleNamespace(
        trip_id="trip_1",
        route_id="1",
        service_id="svc1",
        trip_headsign="Downtown",
        direction_id=0,
        block_id=None,
        shape_id="shape_1",
        scheduled_trip_id=None,
        trip_short_name=None,
        wheelchair_accessible=None,
        bikes_allowed=None,
        route=None,
    )
    stop_times = [
        SimpleNamespace(
            trip_id="trip_1",
            stop_id="stop_1",
            arrival_time="10:00:00",
            departure_time="10:01:00",
            stop_sequence=1,
            trip=trip,
        ),
    ]
    gtfs_service.get_stop_times_by_stop_id.return_value = stop_times

    tu = create_trip_update_with_stop("trip_1", "stop_1", 1234567890)
    gtfs_rt_service.get_real_time_trip_updates.return_value = [tu]
    gtfs_rt_service.get_arrival_time_by_stop_id.return_value = tu.stop_time_update[0]

    mock_dt = mocker.Mock()
    mock_dt.astimezone.return_value.strftime.return_value = "10:05:00"
    mocker.patch(
        "server.gql.resolvers.base.datetime"
    ).fromtimestamp.return_value = mock_dt
    mocker.patch("server.gql.resolvers.base.timezone")

    result = await resolver.arrivals.resolve_arrival_times("stop_1", "2025-01-01")

    assert len(result) == 1
    assert result[0].scheduled_arrival_time == "10:00:00"


@pytest.mark.asyncio
async def test_resolve_earliest_arrival_times_on_route(mocker):
    resolver, gtfs_service, gtfs_rt_service = make_resolver()
    arrival = SimpleNamespace(
        arrival_time="10:00:00", stop_id="stop_1", stop_sequence=1, trip_id="trip_1"
    )
    gtfs_service.get_earliest_arrival_times_on_route.return_value = [arrival]

    tu = create_trip_update_with_stop("trip_1", "stop_1", 1234567890)
    gtfs_rt_service.get_real_time_trip_updates_on_route = AsyncMock(return_value=[tu])
    gtfs_rt_service.get_arrival_time_by_stop_id.return_value = tu.stop_time_update[0]

    mock_dt = mocker.Mock()
    mock_dt.astimezone.return_value.strftime.return_value = "10:05:00"
    mocker.patch(
        "server.gql.resolvers.base.datetime"
    ).fromtimestamp.return_value = mock_dt
    mocker.patch("server.gql.resolvers.base.timezone")

    result = await resolver.arrivals.resolve_earliest_arrival_times_on_route(
        "1", 0, "2025-01-01", "10:00:00"
    )

    assert len(result) == 1
    assert result[0].scheduled_arrival_time == "10:00:00"
    assert result[0].stop_id == "stop_1"


# Feed Info Tests
@pytest.mark.asyncio
async def test_resolve_feed_info():
    resolver, gtfs_service, _ = make_resolver()
    feed_info = SimpleNamespace(
        feed_publisher_name="Capital Metro",
        feed_publisher_url="http://example.com",
        feed_lang="en",
        feed_start_date=None,
        feed_end_date=None,
        feed_version="1.0",
    )
    gtfs_service.get_feed_info.return_value = feed_info

    result = await resolver.resolve_feed_info()

    assert result == feed_info


# Helper Method Tests
def test_get_updated_arrival_time_with_arrival_field(mocker):
    resolver, _, gtfs_rt_service = make_resolver()
    stu = TripUpdate.StopTimeUpdate()
    stu.stop_id = "stop_1"
    stu.arrival.time = 1234567890
    gtfs_rt_service.get_arrival_time_by_stop_id.return_value = stu

    mock_dt = mocker.Mock()
    mock_dt.astimezone.return_value.strftime.return_value = "10:05:00"
    mocker.patch(
        "server.gql.resolvers.base.datetime"
    ).fromtimestamp.return_value = mock_dt
    mocker.patch("server.gql.resolvers.base.timezone")

    result = resolver.arrivals._get_updated_arrival_time("stop_1", [])
    assert result == "10:05:00"


def test_get_updated_arrival_time_not_found():
    resolver, _, gtfs_rt_service = make_resolver()
    gtfs_rt_service.get_arrival_time_by_stop_id.return_value = None

    result = resolver.arrivals._get_updated_arrival_time("stop_1", [])
    assert result is None


def test_get_updated_arrival_time_skipped_stop():
    resolver, _, gtfs_rt_service = make_resolver()
    stu = TripUpdate.StopTimeUpdate()
    stu.stop_id = "stop_1"
    stu.schedule_relationship = 1
    gtfs_rt_service.get_arrival_time_by_stop_id.return_value = stu

    result = resolver.arrivals._get_updated_arrival_time("stop_1", [])
    assert result is None


def test_get_earliest_updated_arrival_time(mocker):
    resolver, _, _ = make_resolver()
    now_ts = 1000000.0
    mocker.patch("server.gql.resolvers.base.time", return_value=now_ts)
    ts1 = now_ts + 3600  # 1 hour from now
    ts2 = now_ts + 900  # 15 min from now (earliest)
    ts3 = now_ts + 2700  # 45 min from now
    mock_raw = mocker.patch.object(resolver.arrivals, "_get_raw_arrival_timestamp")
    mock_raw.side_effect = [ts1, ts2, ts3]

    result = resolver.arrivals._get_earliest_updated_arrival_time(
        "stop_1", [[], [], []]
    )

    tz = timezone("US/Central")
    expected = datetime.fromtimestamp(ts2).astimezone(tz).strftime("%H:%M:%S")
    assert result == expected


def test_get_earliest_updated_arrival_time_all_none(mocker):
    resolver, _, _ = make_resolver()
    now_ts = 1000000.0
    mocker.patch("server.gql.resolvers.base.time", return_value=now_ts)
    mock_raw = mocker.patch.object(resolver.arrivals, "_get_raw_arrival_timestamp")
    mock_raw.return_value = None

    result = resolver.arrivals._get_earliest_updated_arrival_time("stop_1", [[]])
    assert result is None


def test_get_earliest_updated_arrival_time_filters_past(mocker):
    resolver, _, _ = make_resolver()
    now_ts = 1000000.0
    mocker.patch("server.gql.resolvers.base.time", return_value=now_ts)
    past_ts = now_ts - 300  # 5 min ago
    future_ts = now_ts + 600  # 10 min from now
    mock_raw = mocker.patch.object(resolver.arrivals, "_get_raw_arrival_timestamp")
    mock_raw.side_effect = [past_ts, future_ts]

    result = resolver.arrivals._get_earliest_updated_arrival_time("stop_1", [[], []])

    tz = timezone("US/Central")
    expected = datetime.fromtimestamp(future_ts).astimezone(tz).strftime("%H:%M:%S")
    assert result == expected


def test_get_earliest_updated_arrival_time_midnight_crossing(mocker):
    """23:32 should beat 00:02 even though '00:02' < '23:32' as a string."""
    resolver, _, _ = make_resolver()
    tz = timezone("US/Central")
    base = tz.localize(datetime(2026, 3, 3, 23, 0, 0))
    now_ts = base.timestamp()
    mocker.patch("server.gql.resolvers.base.time", return_value=now_ts)

    ts_2332 = tz.localize(datetime(2026, 3, 3, 23, 32, 0)).timestamp()
    ts_0002 = tz.localize(datetime(2026, 3, 4, 0, 2, 0)).timestamp()
    mock_raw = mocker.patch.object(resolver.arrivals, "_get_raw_arrival_timestamp")
    mock_raw.side_effect = [ts_0002, ts_2332]  # 00:02 offered first

    result = resolver.arrivals._get_earliest_updated_arrival_time("stop_1", [[], []])

    assert result == "23:32:00"
