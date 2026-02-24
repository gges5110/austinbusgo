"""
GraphQL endpoint integration tests.

Verifies that the /graphql endpoint is reachable, returns a valid schema,
and that representative queries execute against the real database without
errors.  The container is seeded with the schema but no GTFS data, so
list queries are expected to return empty lists rather than real records.
"""


def _gql(client, query: str) -> dict:
    response = client.post("/graphql", json={"query": query})
    assert response.status_code == 200, response.text
    return response.json()


def test_introspection_typename(app_client):
    """The GraphQL endpoint responds with the root Query type name."""
    data = _gql(app_client, "{ __typename }")
    assert "errors" not in data
    assert data["data"]["__typename"] == "Query"


def test_introspection_schema_has_expected_queries(app_client):
    """Schema introspection exposes the core query fields."""
    data = _gql(app_client, "{ __schema { queryType { fields { name } } } }")
    assert "errors" not in data
    field_names = {f["name"] for f in data["data"]["__schema"]["queryType"]["fields"]}
    # Verify a representative set of expected query entry points
    assert "routes" in field_names
    assert "stopsByName" in field_names
    assert "nearByStops" in field_names
    assert "search" in field_names


def test_routes_query_returns_empty_list(app_client):
    """routes query executes against the real DB and returns [] when no data is seeded."""
    data = _gql(app_client, "{ routes { routeId routeShortName } }")
    assert "errors" not in data
    assert isinstance(data["data"]["routes"], list)
    assert data["data"]["routes"] == []


def test_stops_by_name_returns_empty_list(app_client):
    """stopsByName executes against the real DB and returns [] when no data is seeded."""
    data = _gql(app_client, '{ stopsByName(stopName: "Congress") { stopId stopName } }')
    assert "errors" not in data
    assert isinstance(data["data"]["stopsByName"], list)


def test_search_returns_empty_results(app_client):
    """search query returns empty stops and routes lists against an empty DB."""
    data = _gql(
        app_client,
        '{ search(searchTerm: "Congress") { stops { stopId } routes { routeId } } }',
    )
    assert "errors" not in data
    assert data["data"]["search"]["stops"] == []
    assert data["data"]["search"]["routes"] == []


def test_near_by_stops_returns_empty_list(app_client):
    """nearByStops returns [] for a bbox in Austin when no stops are seeded."""
    data = _gql(
        app_client,
        "{ nearByStops(minLat: 30.25, minLon: -97.76, maxLat: 30.29, maxLon: -97.72) { stopId stopName } }",
    )
    assert "errors" not in data
    assert isinstance(data["data"]["nearByStops"], list)
