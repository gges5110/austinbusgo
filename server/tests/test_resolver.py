import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate

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
    res.gtfs_rt_service = gtfs_rt_service
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

    result = await resolver.resolve_trip(None, None, "trip_1")

    gtfs_service.get_trip_by_id.assert_called_once_with("trip_1")
    assert result == trip


@pytest.mark.asyncio
async def test_resolve_distinct_trips():
    resolver, gtfs_service, _ = make_resolver()
    trips = [SimpleNamespace(trip_id="trip_1"), SimpleNamespace(trip_id="trip_2")]
    gtfs_service.get_trips_by_distinct_short_name.return_value = trips

    result = await resolver.resolve_distinct_trips(None, None, "1", "2025-01-01")

    assert result == trips


@pytest.mark.asyncio
async def test_resolve_trip_ids_for_route():
    resolver, gtfs_service, _ = make_resolver()
    trips = [SimpleNamespace(trip_id="trip_1"), SimpleNamespace(trip_id="trip_2")]
    gtfs_service.get_trips_for_date.return_value = trips

    result = await resolver.resolve_trip_ids_for_route(None, None, "1", "2025-01-01")

    assert result == {"tripIds": ["trip_1", "trip_2"]}


# Stop Tests
@pytest.mark.asyncio
async def test_resolve_stop():
    resolver, gtfs_service, _ = make_resolver()
    stop = SimpleNamespace(
        stop_id="stop_1", stop_name="Test", stop_code=None, stop_loc=None
    )
    gtfs_service.get_stop.return_value = stop

    result = await resolver.resolve_stop(None, None, "stop_1")

    gtfs_service.get_stop.assert_called_once_with("stop_1")
    assert result == stop


@pytest.mark.asyncio
async def test_resolve_near_by_stops():
    resolver, gtfs_service, _ = make_resolver()
    stops = [SimpleNamespace(stop_id="stop_1"), SimpleNamespace(stop_id="stop_2")]
    gtfs_service.get_near_by_stops.return_value = stops

    result = await resolver.resolve_near_by_stops(
        None, None, min_lat=30.0, min_lon=-98.0, max_lat=31.0, max_lon=-97.0
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

    result = await resolver.resolve_near_by_stops(
        None, None, min_lat=30.0, min_lon=-98.0, max_lat=31.0, max_lon=-97.0
    )

    assert result == []


@pytest.mark.asyncio
async def test_resolve_stops_by_name():
    resolver, gtfs_service, _ = make_resolver()
    stops = [SimpleNamespace(stop_id="stop_1")]
    gtfs_service.get_stops_by_name.return_value = stops

    result = await resolver.resolve_stops_by_name(None, None, "Airport")

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

    result = await resolver.resolve_stops_and_shapes(None, None, "1", 0, "2025-01-01")

    assert len(result["stops"]) == 2
    assert result["stops"][0].stop_id == "stop_2"  # sorted by sequence
    assert len(result["shapes"]) == 1


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

    result = await resolver.resolve_route(None, None, "1")

    gtfs_service.get_route.assert_called_once_with("1")
    assert result == route


@pytest.mark.asyncio
async def test_resolve_routes():
    resolver, gtfs_service, _ = make_resolver()
    routes = [SimpleNamespace(route_id="1"), SimpleNamespace(route_id="2")]
    gtfs_service.get_routes.return_value = routes

    result = await resolver.resolve_routes(None, None)

    assert result == routes


@pytest.mark.asyncio
async def test_resolve_route_shapes():
    resolver, gtfs_service, _ = make_resolver()
    agg = SimpleNamespace(
        shape_id="shape_1", shape='{"type":"LineString","coordinates":[[0,0],[1,1]]}'
    )
    gtfs_service.get_shapes_by_trip_id.return_value = agg

    result = await resolver.resolve_route_shapes(None, None, "trip_1")

    gtfs_service.get_shapes_by_trip_id.assert_called_once_with("trip_1")
    assert result.shape_id == "shape_1"


# Real-time Tests
@pytest.mark.asyncio
async def test_resolve_vehicle_positions():
    resolver, _, gtfs_rt_service = make_resolver()
    positions = [VehiclePosition(), VehiclePosition()]
    gtfs_rt_service.get_real_time_vehicle_positions_on_route = AsyncMock(
        return_value=positions
    )

    result = await resolver.resolve_vehicle_positions(None, None, "1", 0)

    assert result == positions


def test_resolve_vehicle_positions_debug():
    resolver, _, gtfs_rt_service = make_resolver()
    positions = [VehiclePosition(), VehiclePosition()]
    gtfs_rt_service.get_real_time_vehicle_positions.return_value = positions

    result = resolver.resolve_vehicle_positions_debug(None, None)

    assert result == positions


def test_resolve_trip_update():
    resolver, _, gtfs_rt_service = make_resolver()
    tu = TripUpdate()
    tu.trip.trip_id = "trip_1"
    gtfs_rt_service.get_all_real_time_trip_updates.return_value = [tu]

    result = resolver.resolve_trip_update(None, None, "trip_1")

    assert result == tu


def test_resolve_trip_update_not_found():
    resolver, _, gtfs_rt_service = make_resolver()
    gtfs_rt_service.get_all_real_time_trip_updates.return_value = []

    result = resolver.resolve_trip_update(None, None, "nonexistent")

    assert result is None


def test_resolve_trip_updates():
    resolver, _, gtfs_rt_service = make_resolver()
    trip_updates = [TripUpdate(), TripUpdate()]
    mock_filter = MagicMock()
    mock_filter.route_id = "1"
    mock_filter.trip_id = "trip_1"
    gtfs_rt_service.get_all_real_time_trip_updates.return_value = trip_updates

    result = resolver.resolve_trip_updates(None, None, mock_filter)

    assert result == trip_updates


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

    result = await resolver.resolve_stop_times(None, None, "trip_1")

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

    result = await resolver.resolve_search(None, None, "Airport Flyer")

    gtfs_service.get_stops_by_name.assert_called_once_with(["Airport", "Flyer"])
    gtfs_service.get_routes_by_name.assert_called_once_with(["Airport", "Flyer"])
    assert result["stops"] == stops
    assert result["routes"] == routes


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
    mocker.patch("server.gql.resolver.datetime").fromtimestamp.return_value = mock_dt
    mocker.patch("server.gql.resolver.timezone")

    result = await resolver.resolve_arrival_times(None, None, "stop_1", "2025-01-01")

    assert len(result) == 1
    assert result[0]["scheduled_arrival_time"] == "10:00:00"


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
    mocker.patch("server.gql.resolver.datetime").fromtimestamp.return_value = mock_dt
    mocker.patch("server.gql.resolver.timezone")

    result = await resolver.resolve_earliest_arrival_times_on_route(
        None, None, "1", 0, "2025-01-01", "10:00:00"
    )

    assert len(result) == 1
    assert result[0]["scheduled_arrival_time"] == "10:00:00"
    assert result[0]["stop_id"] == "stop_1"


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

    result = await resolver.resolve_feed_info(None, None)

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
    mocker.patch("server.gql.resolver.datetime").fromtimestamp.return_value = mock_dt
    mocker.patch("server.gql.resolver.timezone")

    result = resolver._get_updated_arrival_time("stop_1", [])
    assert result == "10:05:00"


def test_get_updated_arrival_time_not_found():
    resolver, _, gtfs_rt_service = make_resolver()
    gtfs_rt_service.get_arrival_time_by_stop_id.return_value = None

    result = resolver._get_updated_arrival_time("stop_1", [])
    assert result is None


def test_get_updated_arrival_time_skipped_stop():
    resolver, _, gtfs_rt_service = make_resolver()
    stu = TripUpdate.StopTimeUpdate()
    stu.stop_id = "stop_1"
    stu.schedule_relationship = 1
    gtfs_rt_service.get_arrival_time_by_stop_id.return_value = stu

    result = resolver._get_updated_arrival_time("stop_1", [])
    assert result is None


def test_get_earliest_updated_arrival_time(mocker):
    resolver, _, _ = make_resolver()
    mock_get = mocker.patch.object(resolver, "_get_updated_arrival_time")
    mock_get.side_effect = ["10:30:00", "10:15:00", "10:45:00"]

    result = resolver._get_earliest_updated_arrival_time("stop_1", [[], [], []])
    assert result == "10:15:00"


def test_get_earliest_updated_arrival_time_all_none(mocker):
    resolver, _, _ = make_resolver()
    mock_get = mocker.patch.object(resolver, "_get_updated_arrival_time")
    mock_get.return_value = None

    result = resolver._get_earliest_updated_arrival_time("stop_1", [[]])
    assert result is None
