"""Endpoint tests for the REST API (mocked services via dependency overrides)."""

import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

from fastapi import FastAPI
from fastapi.testclient import TestClient
from google.transit.gtfs_realtime_pb2 import TripUpdate, VehiclePosition
from sqlalchemy.exc import NoResultFound

from server.api.deps import get_arrival_service, get_gtfs_service, get_rt_service
from server.api.routers import api_router
from server.services.arrival_service import ArrivalService
from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_service import GTFSService

STOP_LOC = '{"type":"Point","coordinates":[-97.74,30.27]}'
SHAPE = '{"type":"LineString","coordinates":[[0,0],[1,1]]}'


@pytest.fixture
def services():
    gtfs = AsyncMock(spec=GTFSService)
    rt = MagicMock(spec=GTFSRTService)
    arrivals = AsyncMock(spec=ArrivalService)
    return gtfs, rt, arrivals


@pytest.fixture
def client(services):
    gtfs, rt, arrivals = services
    app = FastAPI()
    app.include_router(api_router)
    app.dependency_overrides[get_gtfs_service] = lambda: gtfs
    app.dependency_overrides[get_rt_service] = lambda: rt
    app.dependency_overrides[get_arrival_service] = lambda: arrivals
    return TestClient(app)


def make_stop(stop_id="stop_1"):
    return SimpleNamespace(
        stop_id=stop_id, stop_code="1234", stop_name="Test Stop", stop_loc=STOP_LOC
    )


def make_route(route_id="1"):
    return SimpleNamespace(
        route_id=route_id,
        agency_id=None,
        route_short_name="1",
        route_long_name="Test Route",
        route_color="AA0000",
    )


def test_all_stops_attaches_routes(client, services):
    gtfs, _, _ = services
    gtfs.get_stops.return_value = [make_stop("s1"), make_stop("s2")]
    gtfs.get_routes_at_stops.return_value = {"s1": [make_route()], "s2": []}

    response = client.get("/api/stops")

    assert response.status_code == 200
    body = response.json()
    assert body[0]["stopId"] == "s1"
    assert body[0]["stopLoc"] == {"type": "Point", "coordinates": [-97.74, 30.27]}
    assert body[0]["routes"][0]["routeLongName"] == "Test Route"
    assert body[1]["routes"] == []
    gtfs.get_routes_at_stops.assert_called_once_with(["s1", "s2"])


def test_near_by_stops(client, services):
    gtfs, _, _ = services
    gtfs.get_near_by_stops.return_value = [make_stop("s1")]
    gtfs.get_routes_at_stops.return_value = {"s1": [make_route()]}

    response = client.get(
        "/api/stops/nearby?min_lat=30.0&min_lon=-98.0&max_lat=31.0&max_lon=-97.0"
    )

    assert response.status_code == 200
    assert response.json()[0]["stopId"] == "s1"
    kwargs = gtfs.get_near_by_stops.call_args.kwargs
    assert kwargs["limit"] == 20


def test_stops_by_name(client, services):
    gtfs, _, _ = services
    gtfs.get_stops_by_name.return_value = [make_stop()]

    response = client.get("/api/stops/by-name?name=Test")

    assert response.status_code == 200
    assert response.json()[0]["stopName"] == "Test Stop"


def test_stop_found(client, services):
    gtfs, _, _ = services
    gtfs.get_stop.return_value = make_stop()
    gtfs.get_routes_at_stop.return_value = [make_route()]

    response = client.get("/api/stops/stop_1")

    assert response.status_code == 200
    assert response.json()["routes"][0]["routeId"] == "1"


def test_stop_not_found(client, services):
    gtfs, _, _ = services
    gtfs.get_stop.side_effect = NoResultFound()

    response = client.get("/api/stops/nope")

    assert response.status_code == 404


def test_arrival_times(client, services):
    _, _, arrivals = services
    trip = SimpleNamespace(
        trip_id="trip_1", route_id="1", service_id="svc", route=make_route()
    )
    arrivals.get_arrival_times.return_value = [
        SimpleNamespace(
            scheduled_arrival_time="10:00:00",
            updated_arrival_time="10:05:00",
            trip=trip,
        )
    ]

    response = client.get("/api/stops/stop_1/arrival-times?date=20260101")

    assert response.status_code == 200
    body = response.json()
    assert body[0]["scheduledArrivalTime"] == "10:00:00"
    assert body[0]["updatedArrivalTime"] == "10:05:00"
    assert body[0]["trip"]["route"]["routeColor"] == "AA0000"
    arrivals.get_arrival_times.assert_called_once_with("stop_1", "20260101")


def test_routes(client, services):
    gtfs, _, _ = services
    gtfs.get_routes.return_value = [make_route("1"), make_route("2")]

    response = client.get("/api/routes")

    assert response.status_code == 200
    assert [r["routeId"] for r in response.json()] == ["1", "2"]


def test_route_not_found(client, services):
    gtfs, _, _ = services
    gtfs.get_route.side_effect = NoResultFound()

    response = client.get("/api/routes/999")

    assert response.status_code == 404


def test_stops_and_shapes_sorted_with_distinct_trips(client, services):
    gtfs, _, _ = services
    stop1 = SimpleNamespace(
        stop_id="s1",
        stop_code=None,
        stop_name="A",
        stop_loc=STOP_LOC,
        stop_time=SimpleNamespace(
            stop_sequence=2, trip=SimpleNamespace(shape_id="shape_1")
        ),
    )
    stop2 = SimpleNamespace(
        stop_id="s2",
        stop_code=None,
        stop_name="B",
        stop_loc=STOP_LOC,
        stop_time=SimpleNamespace(
            stop_sequence=1, trip=SimpleNamespace(shape_id="shape_1")
        ),
    )
    gtfs.get_stops_by_route_id.return_value = [stop1, stop2]
    gtfs.get_shapes_by_shape_id.return_value = SimpleNamespace(
        shape_id="shape_1", shape=SHAPE
    )
    gtfs.get_trips_by_distinct_short_name.return_value = [
        SimpleNamespace(trip_id="t1", route_id="1", service_id="svc", direction_id=0)
    ]

    response = client.get("/api/routes/1/stops-and-shapes?direction_id=0&date=20260101")

    assert response.status_code == 200
    body = response.json()
    assert [s["stopId"] for s in body["stops"]] == ["s2", "s1"]  # sorted by sequence
    assert len(body["shapes"]) == 1
    assert body["distinctTrips"][0]["tripId"] == "t1"


def test_earliest_arrival_times(client, services):
    _, _, arrivals = services
    arrivals.get_earliest_arrival_times_on_route.return_value = [
        SimpleNamespace(
            stop_id="s1",
            stop_sequence=1,
            scheduled_arrival_time="10:00:00",
            trip_id="t1",
            updated_arrival_time=None,
        )
    ]

    response = client.get(
        "/api/routes/1/earliest-arrival-times?direction_id=0&date=20260101&time=10:00:00"
    )

    assert response.status_code == 200
    assert response.json()[0]["stopSequence"] == 1


def test_trip_ids_for_route(client, services):
    gtfs, _, _ = services
    gtfs.get_trips_for_date.return_value = [
        SimpleNamespace(trip_id="t1"),
        SimpleNamespace(trip_id="t2"),
    ]

    response = client.get("/api/routes/1/trip-ids?date=20260101")

    assert response.status_code == 200
    assert response.json() == {"tripIds": ["t1", "t2"]}


def test_search(client, services):
    gtfs, _, _ = services
    gtfs.get_stops_by_name.return_value = [make_stop("s1")]
    gtfs.get_routes_at_stops.return_value = {"s1": [make_route()]}
    gtfs.get_routes_by_name.return_value = [make_route("2")]

    response = client.get("/api/search?q=test")

    assert response.status_code == 200
    body = response.json()
    assert body["stops"][0]["routes"][0]["routeId"] == "1"
    assert body["routes"][0]["routeId"] == "2"
    gtfs.get_stops_by_name.assert_called_once_with("test", limit=8)
    gtfs.get_routes_by_name.assert_called_once_with("test", limit=8)


def test_trip_not_found(client, services):
    gtfs, _, _ = services
    gtfs.get_trip_by_id.side_effect = NoResultFound()

    response = client.get("/api/trips/nope")

    assert response.status_code == 404


def test_stop_times_includes_stop(client, services):
    gtfs, _, _ = services
    gtfs.get_stop_times_by_trip_id.return_value = [
        SimpleNamespace(
            trip_id="t1",
            arrival_time="10:00:00",
            departure_time="10:01:00",
            stop_id="s1",
            stop_sequence=1,
            pickup_type=None,
            drop_off_type=None,
            shape_dist_traveled=None,
            timepoint=None,
            stop=make_stop("s1"),
        )
    ]

    response = client.get("/api/trips/t1/stop-times")

    assert response.status_code == 200
    assert response.json()[0]["stop"]["stopName"] == "Test Stop"


def test_vehicle_positions_all(client, services):
    _, rt, _ = services
    rt.get_real_time_vehicle_positions.return_value = [
        VehiclePosition(),
        VehiclePosition(),
    ]

    response = client.get("/api/rt/vehicle-positions")

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_vehicle_positions_on_route(client, services):
    _, rt, _ = services
    rt.get_real_time_vehicle_positions_on_route = AsyncMock(
        return_value=[VehiclePosition()]
    )

    response = client.get("/api/rt/vehicle-positions?route_id=1&direction=0")

    assert response.status_code == 200
    assert len(response.json()) == 1
    rt.get_real_time_vehicle_positions_on_route.assert_called_once_with("1", 0)


def test_vehicle_positions_route_requires_direction(client, services):
    response = client.get("/api/rt/vehicle-positions?route_id=1")

    assert response.status_code == 422


def test_trip_update_found(client, services):
    _, rt, _ = services
    tu = TripUpdate()
    tu.trip.trip_id = "t1"
    tu.timestamp = 123
    rt.get_all_real_time_trip_updates.return_value = [tu]

    response = client.get("/api/rt/trip-updates/t1")

    assert response.status_code == 200
    assert response.json()["trip"]["tripId"] == "t1"


def test_trip_update_not_found(client, services):
    _, rt, _ = services
    rt.get_all_real_time_trip_updates.return_value = []

    response = client.get("/api/rt/trip-updates/nope")

    assert response.status_code == 200
    assert response.json() is None


def test_feed_info(client, services):
    gtfs, _, _ = services
    gtfs.get_feed_info.return_value = SimpleNamespace(
        feed_publisher_name="Capital Metro",
        feed_publisher_url="http://example.com",
        feed_lang="en",
        feed_start_date=None,
        feed_end_date=None,
        feed_version="1.0",
    )

    response = client.get("/api/feed-info")

    assert response.status_code == 200
    assert response.json()["feedPublisherName"] == "Capital Metro"
