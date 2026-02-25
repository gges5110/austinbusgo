"""
GraphQL integration tests with seeded GTFS data.

Every test here runs against a database that contains a minimal but
representative set of GTFS rows:

  - 1 route   : id="10", short_name="10", long_name="Congress Avenue"
  - 2 stops   : "stop-1" (Congress & 1st) and "stop-2" (Congress & 2nd)
  - 1 shape   : id="shp-1" (two-point LineString along Congress Ave)
  - 1 trip    : id="trip-1", route="10", headsign="Downtown", direction=0
  - 1 service : "svc-1" active on 2026-02-24
  - 2 stop_times for trip-1: stop-1 @ 23:50, stop-2 @ 23:59
  - 1 feed_info row

Unlike test_graphql.py (which only verifies empty-DB behaviour) these tests
assert that queries return correct records with the expected field values.
"""

import pytest


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


def _gql(client, query: str) -> dict:
    response = client.post("/graphql", json={"query": query})
    assert response.status_code == 200, response.text
    data = response.json()
    assert "errors" not in data, f"GraphQL errors: {data.get('errors')}"
    return data["data"]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


def test_routes_returns_seeded_route(data_app_client):
    """routes query returns the seeded route with correct fields."""
    data = _gql(data_app_client, "{ routes { routeId routeShortName routeLongName } }")
    routes = data["routes"]
    assert len(routes) == 1
    assert routes[0]["routeId"] == "10"
    assert routes[0]["routeShortName"] == "10"
    assert routes[0]["routeLongName"] == "Congress Avenue"


def test_route_by_id(data_app_client):
    """route(routeId) returns the correct single route."""
    data = _gql(
        data_app_client,
        '{ route(routeId: "10") { routeId routeLongName routeColor } }',
    )
    route = data["route"]
    assert route["routeId"] == "10"
    assert route["routeLongName"] == "Congress Avenue"
    assert route["routeColor"] == "FF0000"


# ---------------------------------------------------------------------------
# Stops
# ---------------------------------------------------------------------------


def test_stops_by_name_matches_on_stop_name(data_app_client):
    """stopsByName returns all stops whose name contains the search term."""
    data = _gql(
        data_app_client,
        '{ stopsByName(stopName: "Congress") { stopId stopName } }',
    )
    stops = data["stopsByName"]
    assert len(stops) == 2
    stop_ids = {s["stopId"] for s in stops}
    assert "stop-1" in stop_ids
    assert "stop-2" in stop_ids


def test_stop_by_id(data_app_client):
    """stop(stopId) returns the correct stop with name and code."""
    data = _gql(
        data_app_client,
        '{ stop(stopId: "stop-1") { stopId stopName stopCode } }',
    )
    stop = data["stop"]
    assert stop["stopId"] == "stop-1"
    assert stop["stopName"] == "Congress & 1st"
    assert stop["stopCode"] == "1001"


def test_stop_loc_is_point_geometry(data_app_client):
    """stop(stopId).stopLoc returns a Point GeoJSON geometry."""
    data = _gql(
        data_app_client,
        '{ stop(stopId: "stop-1") { stopLoc { type coordinates } } }',
    )
    loc = data["stop"]["stopLoc"]
    assert loc["type"] == "Point"
    assert len(loc["coordinates"]) == 2


def test_near_by_stops_returns_stops_in_bbox(data_app_client):
    """nearByStops returns stops whose location falls within the bounding box."""
    data = _gql(
        data_app_client,
        """{ nearByStops(
                minLat: 30.26, minLon: -97.75,
                maxLat: 30.27, maxLon: -97.74
            ) { stopId stopName } }""",
    )
    stops = data["nearByStops"]
    assert len(stops) >= 1
    stop_ids = {s["stopId"] for s in stops}
    assert "stop-1" in stop_ids


def test_near_by_stops_excludes_out_of_bbox(data_app_client):
    """nearByStops returns an empty list when the bbox misses all stops."""
    data = _gql(
        data_app_client,
        """{ nearByStops(
                minLat: 31.0, minLon: -97.0,
                maxLat: 32.0, maxLon: -96.0
            ) { stopId } }""",
    )
    assert data["nearByStops"] == []


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


def test_search_returns_matching_stops_and_routes(data_app_client):
    """search returns both stops and routes matching the search term."""
    data = _gql(
        data_app_client,
        '{ search(searchTerm: "Congress") { stops { stopId } routes { routeId } } }',
    )
    assert len(data["search"]["stops"]) == 2
    assert len(data["search"]["routes"]) == 1
    assert data["search"]["routes"][0]["routeId"] == "10"


def test_search_no_results_for_unknown_term(data_app_client):
    """search returns empty stops and routes for a term with no matches."""
    data = _gql(
        data_app_client,
        '{ search(searchTerm: "zzznomatch") { stops { stopId } routes { routeId } } }',
    )
    assert data["search"]["stops"] == []
    assert data["search"]["routes"] == []


# ---------------------------------------------------------------------------
# Trips
# ---------------------------------------------------------------------------


def test_trip_by_id_with_nested_route(data_app_client):
    """trip(tripId) returns the trip with correct fields and nested route."""
    data = _gql(
        data_app_client,
        """{ trip(tripId: "trip-1") {
                tripId tripHeadsign directionId shapeId
                route { routeId routeShortName }
            } }""",
    )
    trip = data["trip"]
    assert trip["tripId"] == "trip-1"
    assert trip["tripHeadsign"] == "Downtown"
    assert trip["directionId"] == 0
    assert trip["shapeId"] == "shp-1"
    assert trip["route"]["routeId"] == "10"
    assert trip["route"]["routeShortName"] == "10"


def test_trip_ids_for_route(data_app_client):
    """tripIdsForRoute returns the expected trip IDs for the seeded date."""
    data = _gql(
        data_app_client,
        '{ tripIdsForRoute(routeId: "10", date: "20260224") { tripIds } }',
    )
    assert "trip-1" in data["tripIdsForRoute"]["tripIds"]


def test_distinct_trips_groups_by_headsign(data_app_client):
    """distinctTrips returns one trip per unique (direction, headsign) pair."""
    data = _gql(
        data_app_client,
        '{ distinctTrips(routeId: "10", date: "20260224") { tripId tripHeadsign } }',
    )
    trips = data["distinctTrips"]
    assert len(trips) == 1
    assert trips[0]["tripId"] == "trip-1"
    assert trips[0]["tripHeadsign"] == "Downtown"


# ---------------------------------------------------------------------------
# Stop times
# ---------------------------------------------------------------------------


def test_stop_times_for_trip(data_app_client):
    """stopTimes returns all stop times for the trip in sequence order."""
    data = _gql(
        data_app_client,
        """{ stopTimes(tripId: "trip-1") {
                tripId arrivalTime stopSequence
                stop { stopId stopName }
            } }""",
    )
    stop_times = data["stopTimes"]
    assert len(stop_times) == 2
    assert stop_times[0]["stopSequence"] == 1
    assert stop_times[0]["arrivalTime"] == "23:50:00"
    assert stop_times[0]["stop"]["stopId"] == "stop-1"
    assert stop_times[1]["stopSequence"] == 2
    assert stop_times[1]["arrivalTime"] == "23:59:00"
    assert stop_times[1]["stop"]["stopId"] == "stop-2"


def test_arrival_times_executes_without_error(data_app_client):
    """
    arrivalTimes runs against the real DB without raising an error.

    The query applies a time-of-day cutoff (arrival_time > now - 10 min) so
    the number of results depends on when the test is executed.  We therefore
    only assert structure, not a specific row count.
    """
    data = _gql(
        data_app_client,
        """{ arrivalTimes(stopId: "stop-1", date: "20260224") {
                scheduledArrivalTime
                trip { tripId }
            } }""",
    )
    assert isinstance(data["arrivalTimes"], list)


def test_earliest_arrival_times_on_route(data_app_client):
    """earliestArrivalTimesOnRoute returns one row per stop starting from time=00:00:00."""
    data = _gql(
        data_app_client,
        """{ earliestArrivalTimesOnRoute(
                routeId: "10",
                directionId: 0,
                date: "20260224",
                time: "00:00:00"
            ) { stopId stopSequence scheduledArrivalTime } }""",
    )
    rows = data["earliestArrivalTimesOnRoute"]
    assert len(rows) == 2
    stop_ids = {r["stopId"] for r in rows}
    assert "stop-1" in stop_ids
    assert "stop-2" in stop_ids


# ---------------------------------------------------------------------------
# Shapes
# ---------------------------------------------------------------------------


def test_route_shapes_returns_linestring(data_app_client):
    """routeShapes returns a LineString geometry for the trip's shape."""
    data = _gql(
        data_app_client,
        '{ routeShapes(tripId: "trip-1") { type coordinates } }',
    )
    shape = data["routeShapes"]
    assert shape["type"] == "LineString"
    assert len(shape["coordinates"]) == 2


def test_stops_and_shapes_returns_stops_with_geometry(data_app_client):
    """stopsAndShapes returns the stops and shape LineStrings for a route/direction."""
    data = _gql(
        data_app_client,
        """{ stopsAndShapes(routeId: "10", directionId: 0, date: "20260224") {
                stops { stopId }
                shapes { type coordinates }
            } }""",
    )
    result = data["stopsAndShapes"]
    stop_ids = {s["stopId"] for s in result["stops"]}
    assert "stop-1" in stop_ids
    assert "stop-2" in stop_ids
    assert len(result["shapes"]) >= 1
    assert result["shapes"][0]["type"] == "LineString"


# ---------------------------------------------------------------------------
# Feed info
# ---------------------------------------------------------------------------


def test_feed_info_returns_seeded_publisher(data_app_client):
    """feedInfo returns the publisher name and version from the seeded row."""
    data = _gql(
        data_app_client,
        "{ feedInfo { feedPublisherName feedVersion feedLang feedStartDate feedEndDate } }",
    )
    info = data["feedInfo"]
    assert info["feedPublisherName"] == "CapMetro Test"
    assert info["feedVersion"] == "test-v1"
    assert info["feedLang"] == "en"
    assert info["feedStartDate"] == "2026-01-01"
    assert info["feedEndDate"] == "2026-12-31"
