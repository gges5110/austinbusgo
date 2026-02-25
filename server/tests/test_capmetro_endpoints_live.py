"""
Live endpoint verification tests for CapMetro GTFS-RT feeds.

These tests make real HTTP calls to the CapMetro data endpoints hosted on the
Texas Open Data Portal. They are NOT part of the regular test suite (which uses
mocks) — run them manually to verify the endpoints are reachable and returning
valid protobuf data.

Usage (from the repo root with the virtualenv active):
    python -m pytest server/tests/test_capmetro_endpoints_live.py -v -s

Or run the standalone check directly:
    python server/tests/test_capmetro_endpoints_live.py
"""

import sys
import time

import httpx
import pytest
from google.transit import gtfs_realtime_pb2

VEHICLE_POSITIONS_URL = (
    "https://data.texas.gov/download/eiei-9rpf/application%2Foctet-stream"
)
TRIP_UPDATES_URL = (
    "https://data.texas.gov/download/rmk2-acnw/application%2Foctet-stream"
)

TIMEOUT_SECONDS = 15


def _fetch_feed(url: str) -> gtfs_realtime_pb2.FeedMessage:
    """Fetch and parse a GTFS-RT protobuf feed from the given URL."""
    response = httpx.get(url, timeout=TIMEOUT_SECONDS, follow_redirects=True)
    response.raise_for_status()
    feed = gtfs_realtime_pb2.FeedMessage()
    feed.ParseFromString(response.content)
    return feed


# ---------------------------------------------------------------------------
# pytest tests
# ---------------------------------------------------------------------------


@pytest.mark.live
def test_vehicle_positions_endpoint_returns_200():
    """Vehicle positions endpoint responds with HTTP 200."""
    response = httpx.get(
        VEHICLE_POSITIONS_URL, timeout=TIMEOUT_SECONDS, follow_redirects=True
    )
    assert response.status_code == 200, (
        f"Expected 200, got {response.status_code}"
    )
    assert len(response.content) > 0, "Response body is empty"


@pytest.mark.live
def test_vehicle_positions_parses_as_valid_protobuf():
    """Vehicle positions feed can be parsed as a valid GTFS-RT FeedMessage."""
    response = httpx.get(
        VEHICLE_POSITIONS_URL, timeout=TIMEOUT_SECONDS, follow_redirects=True
    )
    response.raise_for_status()

    feed = gtfs_realtime_pb2.FeedMessage()
    feed.ParseFromString(response.content)

    assert feed.header.gtfs_realtime_version != "", (
        "GTFS-RT version header is missing"
    )
    assert feed.header.timestamp > 0, "Feed timestamp is missing or zero"


@pytest.mark.live
def test_vehicle_positions_contains_entities():
    """Vehicle positions feed contains at least one vehicle entity."""
    feed = _fetch_feed(VEHICLE_POSITIONS_URL)
    assert len(feed.entity) > 0, "Feed returned zero entities — no buses active?"

    vehicle_entities = [e for e in feed.entity if e.HasField("vehicle")]
    assert len(vehicle_entities) > 0, (
        f"Got {len(feed.entity)} entities but none have a vehicle field"
    )


@pytest.mark.live
def test_vehicle_positions_have_lat_lon():
    """All vehicle entities include a valid latitude/longitude."""
    feed = _fetch_feed(VEHICLE_POSITIONS_URL)
    vehicle_entities = [e for e in feed.entity if e.HasField("vehicle")]
    assert len(vehicle_entities) > 0

    bad = []
    for entity in vehicle_entities:
        pos = entity.vehicle.position
        if not (-90 <= pos.latitude <= 90 and -180 <= pos.longitude <= 180):
            bad.append(entity.id)
        # Austin is roughly lat 30.2, lon -97.7 — flag anything wildly off
        if not (29 <= pos.latitude <= 31 and -99 <= pos.longitude <= -96):
            bad.append(f"{entity.id} (out of Austin area: {pos.latitude},{pos.longitude})")

    assert len(bad) == 0, f"Entities with unexpected coordinates: {bad}"


@pytest.mark.live
def test_trip_updates_endpoint_returns_200():
    """Trip updates endpoint responds with HTTP 200."""
    response = httpx.get(
        TRIP_UPDATES_URL, timeout=TIMEOUT_SECONDS, follow_redirects=True
    )
    assert response.status_code == 200, (
        f"Expected 200, got {response.status_code}"
    )
    assert len(response.content) > 0, "Response body is empty"


@pytest.mark.live
def test_trip_updates_parses_as_valid_protobuf():
    """Trip updates feed can be parsed as a valid GTFS-RT FeedMessage."""
    response = httpx.get(
        TRIP_UPDATES_URL, timeout=TIMEOUT_SECONDS, follow_redirects=True
    )
    response.raise_for_status()

    feed = gtfs_realtime_pb2.FeedMessage()
    feed.ParseFromString(response.content)

    assert feed.header.gtfs_realtime_version != "", (
        "GTFS-RT version header is missing"
    )
    assert feed.header.timestamp > 0, "Feed timestamp is missing or zero"


@pytest.mark.live
def test_trip_updates_contains_entities():
    """Trip updates feed contains at least one trip update entity."""
    feed = _fetch_feed(TRIP_UPDATES_URL)
    assert len(feed.entity) > 0, "Feed returned zero entities"

    update_entities = [e for e in feed.entity if e.HasField("trip_update")]
    assert len(update_entities) > 0, (
        f"Got {len(feed.entity)} entities but none have a trip_update field"
    )


# ---------------------------------------------------------------------------
# Standalone summary report (python server/tests/test_capmetro_endpoints_live.py)
# ---------------------------------------------------------------------------


def _report_feed(name: str, url: str) -> bool:
    """Fetch a feed and print a human-readable summary. Returns True on success."""
    print(f"\n{'=' * 60}")
    print(f"  {name}")
    print(f"  {url}")
    print("=" * 60)
    try:
        t0 = time.monotonic()
        response = httpx.get(url, timeout=TIMEOUT_SECONDS, follow_redirects=True)
        elapsed = time.monotonic() - t0

        print(f"  HTTP status  : {response.status_code}")
        print(f"  Response size: {len(response.content):,} bytes")
        print(f"  Elapsed      : {elapsed:.2f}s")

        if response.status_code != 200:
            print(f"  ERROR: non-200 status code")
            return False

        feed = gtfs_realtime_pb2.FeedMessage()
        feed.ParseFromString(response.content)

        import datetime

        ts = datetime.datetime.fromtimestamp(feed.header.timestamp, tz=datetime.timezone.utc)
        print(f"  GTFS-RT ver  : {feed.header.gtfs_realtime_version}")
        print(f"  Feed timestamp: {ts.isoformat()}")
        print(f"  Total entities: {len(feed.entity)}")

        if name.lower().startswith("vehicle"):
            vehicles = [e for e in feed.entity if e.HasField("vehicle")]
            routes = {e.vehicle.trip.route_id for e in vehicles if e.vehicle.HasField("trip")}
            print(f"  Vehicle entities: {len(vehicles)}")
            print(f"  Active routes   : {len(routes)}")
            if vehicles:
                sample = vehicles[0]
                pos = sample.vehicle.position
                print(
                    f"  Sample vehicle  : id={sample.id!r} "
                    f"route={sample.vehicle.trip.route_id!r} "
                    f"lat={pos.latitude:.4f} lon={pos.longitude:.4f}"
                )
        else:
            updates = [e for e in feed.entity if e.HasField("trip_update")]
            routes = {e.trip_update.trip.route_id for e in updates}
            print(f"  Trip update entities: {len(updates)}")
            print(f"  Routes with updates : {len(routes)}")
            if updates:
                sample = updates[0]
                stu = sample.trip_update.stop_time_update
                print(
                    f"  Sample trip     : id={sample.id!r} "
                    f"route={sample.trip_update.trip.route_id!r} "
                    f"stop_time_updates={len(stu)}"
                )

        print("  STATUS: OK")
        return True

    except httpx.TimeoutException:
        print(f"  ERROR: request timed out after {TIMEOUT_SECONDS}s")
        return False
    except httpx.HTTPStatusError as exc:
        print(f"  ERROR: HTTP {exc.response.status_code}")
        return False
    except Exception as exc:  # noqa: BLE001
        print(f"  ERROR: {type(exc).__name__}: {exc}")
        return False


if __name__ == "__main__":
    ok_vp = _report_feed("Vehicle Positions", VEHICLE_POSITIONS_URL)
    ok_tu = _report_feed("Trip Updates", TRIP_UPDATES_URL)

    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    print(f"  Vehicle Positions : {'OK' if ok_vp else 'FAIL'}")
    print(f"  Trip Updates      : {'OK' if ok_tu else 'FAIL'}")

    if ok_vp and ok_tu:
        print("\n  Both CapMetro GTFS-RT endpoints are reachable and valid.")
        sys.exit(0)
    else:
        print("\n  One or more endpoints failed. Check output above.")
        sys.exit(1)
