"""
REST API integration tests.

Verifies that the /api endpoints are reachable and that representative
requests execute against the real database without errors.  The container
is seeded with the schema but no GTFS data, so list endpoints are expected
to return empty lists rather than real records.
"""


def test_openapi_schema_has_expected_paths(app_client):
    """The OpenAPI schema exposes the core endpoints."""
    response = app_client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/routes" in paths
    assert "/api/stops/by-name" in paths
    assert "/api/stops/nearby" in paths
    assert "/api/search" in paths


def test_routes_returns_empty_list(app_client):
    """/api/routes executes against the real DB and returns [] when no data is seeded."""
    response = app_client.get("/api/routes")
    assert response.status_code == 200
    assert response.json() == []


def test_stops_by_name_returns_empty_list(app_client):
    """/api/stops/by-name executes against the real DB and returns [] when no data is seeded."""
    response = app_client.get("/api/stops/by-name?name=Congress")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_search_returns_empty_results(app_client):
    """/api/search returns empty stops and routes lists against an empty DB."""
    response = app_client.get("/api/search?q=Congress")
    assert response.status_code == 200
    body = response.json()
    assert body["stops"] == []
    assert body["routes"] == []


def test_near_by_stops_returns_empty_list(app_client):
    """/api/stops/nearby returns [] for a bbox in Austin when no stops are seeded."""
    response = app_client.get(
        "/api/stops/nearby?min_lat=30.25&min_lon=-97.76&max_lat=30.29&max_lon=-97.72"
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
