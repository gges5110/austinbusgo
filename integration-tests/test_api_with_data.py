"""
REST API integration tests with seeded GTFS data.

Every test here runs against a database that contains a minimal but
representative set of GTFS rows:

  - 1 route   : id="10", short_name="10", long_name="Congress Avenue"
  - 2 stops   : "stop-1" (Congress & 1st) and "stop-2" (Congress & 2nd)
  - 1 shape   : id="shp-1" (two-point LineString along Congress Ave)
  - 1 trip    : id="trip-1", route="10", headsign="Downtown", direction=0
  - 1 service : "svc-1" active on 2026-02-24
  - 2 stop_times for trip-1: stop-1 @ 23:50, stop-2 @ 23:59
  - 1 feed_info row

Unlike test_api.py (which only verifies empty-DB behaviour) these tests
assert that endpoints return correct records with the expected field values.
"""


def _get(client, path: str):
    response = client.get(path)
    assert response.status_code == 200, response.text
    return response.json()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


def test_routes_returns_seeded_route(data_app_client):
    """/api/routes returns the seeded route with correct fields."""
    routes = _get(data_app_client, "/api/routes")
    assert len(routes) == 1
    assert routes[0]["routeId"] == "10"
    assert routes[0]["routeShortName"] == "10"
    assert routes[0]["routeLongName"] == "Congress Avenue"


def test_route_by_id(data_app_client):
    """/api/routes/{id} returns the correct single route."""
    route = _get(data_app_client, "/api/routes/10")
    assert route["routeId"] == "10"
    assert route["routeLongName"] == "Congress Avenue"
    assert route["routeColor"] == "FF0000"


def test_route_not_found_returns_404(data_app_client):
    response = data_app_client.get("/api/routes/999")
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Stops
# ---------------------------------------------------------------------------


def test_stops_by_name_matches_on_stop_name(data_app_client):
    """/api/stops/by-name returns all stops whose name matches the search term."""
    stops = _get(data_app_client, "/api/stops/by-name?name=Congress")
    assert len(stops) == 2
    stop_ids = {s["stopId"] for s in stops}
    assert "stop-1" in stop_ids
    assert "stop-2" in stop_ids


def test_stop_by_id(data_app_client):
    """/api/stops/{id} returns the correct stop with name and code."""
    stop = _get(data_app_client, "/api/stops/stop-1")
    assert stop["stopId"] == "stop-1"
    assert stop["stopName"] == "Congress & 1st"
    assert stop["stopCode"] == "1001"


def test_stop_loc_is_point_geometry(data_app_client):
    """/api/stops/{id} stopLoc is a Point GeoJSON geometry."""
    stop = _get(data_app_client, "/api/stops/stop-1")
    loc = stop["stopLoc"]
    assert loc["type"] == "Point"
    assert len(loc["coordinates"]) == 2


def test_all_stops_includes_routes(data_app_client):
    """/api/stops returns every stop with its routes attached."""
    stops = _get(data_app_client, "/api/stops")
    assert len(stops) == 2
    by_id = {s["stopId"]: s for s in stops}
    assert by_id["stop-1"]["routes"][0]["routeId"] == "10"


def test_near_by_stops_returns_stops_in_bbox(data_app_client):
    """/api/stops/nearby returns stops whose location falls within the bounding box."""
    stops = _get(
        data_app_client,
        "/api/stops/nearby?min_lat=30.26&min_lon=-97.75&max_lat=30.27&max_lon=-97.74",
    )
    assert len(stops) >= 1
    stop_ids = {s["stopId"] for s in stops}
    assert "stop-1" in stop_ids


def test_near_by_stops_excludes_out_of_bbox(data_app_client):
    """/api/stops/nearby returns an empty list when the bbox misses all stops."""
    stops = _get(
        data_app_client,
        "/api/stops/nearby?min_lat=31.0&min_lon=-97.0&max_lat=32.0&max_lon=-96.0",
    )
    assert stops == []


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


def test_search_returns_matching_stops_and_routes(data_app_client):
    """/api/search returns both stops and routes matching the search term."""
    body = _get(data_app_client, "/api/search?q=Congress")
    assert len(body["stops"]) == 2
    assert len(body["routes"]) == 1
    assert body["routes"][0]["routeId"] == "10"


def test_search_no_results_for_unknown_term(data_app_client):
    """/api/search returns empty stops and routes for a term with no matches."""
    body = _get(data_app_client, "/api/search?q=zzznomatch")
    assert body["stops"] == []
    assert body["routes"] == []


# ---------------------------------------------------------------------------
# Trips
# ---------------------------------------------------------------------------


def test_trip_by_id_with_nested_route(data_app_client):
    """/api/trips/{id} returns the trip with correct fields and nested route."""
    trip = _get(data_app_client, "/api/trips/trip-1")
    assert trip["tripId"] == "trip-1"
    assert trip["tripHeadsign"] == "Downtown"
    assert trip["directionId"] == 0
    assert trip["shapeId"] == "shp-1"
    assert trip["route"]["routeId"] == "10"
    assert trip["route"]["routeShortName"] == "10"


def test_trip_ids_for_route(data_app_client):
    """/api/routes/{id}/trip-ids returns the expected trip IDs for the seeded date."""
    body = _get(data_app_client, "/api/routes/10/trip-ids?date=20260224")
    assert "trip-1" in body["tripIds"]


# ---------------------------------------------------------------------------
# Stop times
# ---------------------------------------------------------------------------


def test_stop_times_for_trip(data_app_client):
    """/api/trips/{id}/stop-times returns all stop times in sequence order."""
    stop_times = _get(data_app_client, "/api/trips/trip-1/stop-times")
    assert len(stop_times) == 2
    assert stop_times[0]["stopSequence"] == 1
    assert stop_times[0]["arrivalTime"] == "23:50:00"
    assert stop_times[0]["stop"]["stopId"] == "stop-1"
    assert stop_times[1]["stopSequence"] == 2
    assert stop_times[1]["arrivalTime"] == "23:59:00"
    assert stop_times[1]["stop"]["stopId"] == "stop-2"


def test_arrival_times_executes_without_error(data_app_client):
    """
    /api/stops/{id}/arrival-times runs against the real DB without error.

    The query applies a time-of-day cutoff (arrival_time > now - 10 min) so
    the number of results depends on when the test is executed.  We therefore
    only assert structure, not a specific row count.
    """
    body = _get(data_app_client, "/api/stops/stop-1/arrival-times?date=20260224")
    assert isinstance(body, list)


def test_earliest_arrival_times_on_route(data_app_client):
    """Earliest arrivals returns one row per stop starting from time=00:00:00."""
    rows = _get(
        data_app_client,
        "/api/routes/10/earliest-arrival-times"
        "?direction_id=0&date=20260224&time=00:00:00",
    )
    assert len(rows) == 2
    stop_ids = {r["stopId"] for r in rows}
    assert "stop-1" in stop_ids
    assert "stop-2" in stop_ids


# ---------------------------------------------------------------------------
# Shapes
# ---------------------------------------------------------------------------


def test_stops_and_shapes_returns_stops_geometry_and_trips(data_app_client):
    """stops-and-shapes returns stops, shape LineStrings, and distinct trips."""
    body = _get(
        data_app_client, "/api/routes/10/stops-and-shapes?direction_id=0&date=20260224"
    )
    stop_ids = {s["stopId"] for s in body["stops"]}
    assert "stop-1" in stop_ids
    assert "stop-2" in stop_ids
    assert len(body["shapes"]) >= 1
    assert body["shapes"][0]["type"] == "LineString"
    assert body["distinctTrips"][0]["tripId"] == "trip-1"
    assert body["distinctTrips"][0]["tripHeadsign"] == "Downtown"


# ---------------------------------------------------------------------------
# Feed info
# ---------------------------------------------------------------------------


def test_feed_info_returns_seeded_publisher(data_app_client):
    """/api/feed-info returns the publisher name and version from the seeded row."""
    info = _get(data_app_client, "/api/feed-info")
    assert info["feedPublisherName"] == "CapMetro Test"
    assert info["feedVersion"] == "test-v1"
    assert info["feedLang"] == "en"
    assert info["feedStartDate"] == "2026-01-01"
    assert info["feedEndDate"] == "2026-12-31"
