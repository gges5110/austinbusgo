"""Tests for the arrival time merging service (ported from the former
GraphQL resolver tests)."""

import pytest
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from google.transit.gtfs_realtime_pb2 import TripUpdate
from pytz import timezone

from server.services.arrival_service import ArrivalService
from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_service import GTFSService


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


def make_service():
    gtfs_service = AsyncMock(spec=GTFSService)
    gtfs_rt_service = MagicMock(spec=GTFSRTService)
    return ArrivalService(gtfs_service, gtfs_rt_service), gtfs_service, gtfs_rt_service


@pytest.mark.asyncio
async def test_get_arrival_times(mocker):
    svc, gtfs_service, gtfs_rt_service = make_service()
    trip = SimpleNamespace(trip_id="trip_1", route_id="1")
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
        "server.services.arrival_service.datetime"
    ).fromtimestamp.return_value = mock_dt
    mocker.patch("server.services.arrival_service.timezone")

    result = await svc.get_arrival_times("stop_1", "2025-01-01")

    assert len(result) == 1
    assert result[0].scheduled_arrival_time == "10:00:00"
    assert result[0].updated_arrival_time == "10:05:00"
    assert result[0].trip is trip


@pytest.mark.asyncio
async def test_get_earliest_arrival_times_on_route(mocker):
    svc, gtfs_service, gtfs_rt_service = make_service()
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
        "server.services.arrival_service.datetime"
    ).fromtimestamp.return_value = mock_dt
    mocker.patch("server.services.arrival_service.timezone")

    result = await svc.get_earliest_arrival_times_on_route(
        "1", 0, "2025-01-01", "10:00:00"
    )

    assert len(result) == 1
    assert result[0].scheduled_arrival_time == "10:00:00"
    assert result[0].stop_id == "stop_1"


def test_get_updated_arrival_time_with_arrival_field(mocker):
    svc, _, gtfs_rt_service = make_service()
    stu = TripUpdate.StopTimeUpdate()
    stu.stop_id = "stop_1"
    stu.arrival.time = 1234567890
    gtfs_rt_service.get_arrival_time_by_stop_id.return_value = stu

    mock_dt = mocker.Mock()
    mock_dt.astimezone.return_value.strftime.return_value = "10:05:00"
    mocker.patch(
        "server.services.arrival_service.datetime"
    ).fromtimestamp.return_value = mock_dt
    mocker.patch("server.services.arrival_service.timezone")

    result = svc._get_updated_arrival_time("stop_1", [])
    assert result == "10:05:00"


def test_get_updated_arrival_time_not_found():
    svc, _, gtfs_rt_service = make_service()
    gtfs_rt_service.get_arrival_time_by_stop_id.return_value = None

    result = svc._get_updated_arrival_time("stop_1", [])
    assert result is None


def test_get_updated_arrival_time_skipped_stop():
    svc, _, gtfs_rt_service = make_service()
    stu = TripUpdate.StopTimeUpdate()
    stu.stop_id = "stop_1"
    stu.schedule_relationship = 1
    gtfs_rt_service.get_arrival_time_by_stop_id.return_value = stu

    result = svc._get_updated_arrival_time("stop_1", [])
    assert result is None


def test_get_earliest_updated_arrival_time(mocker):
    svc, _, _ = make_service()
    now_ts = 1000000.0
    mocker.patch("server.services.arrival_service.time", return_value=now_ts)
    ts1 = now_ts + 3600  # 1 hour from now
    ts2 = now_ts + 900  # 15 min from now (earliest)
    ts3 = now_ts + 2700  # 45 min from now
    mock_raw = mocker.patch.object(svc, "_get_raw_arrival_timestamp")
    mock_raw.side_effect = [ts1, ts2, ts3]

    result = svc._get_earliest_updated_arrival_time("stop_1", [[], [], []])

    tz = timezone("US/Central")
    expected = datetime.fromtimestamp(ts2).astimezone(tz).strftime("%H:%M:%S")
    assert result == expected


def test_get_earliest_updated_arrival_time_all_none(mocker):
    svc, _, _ = make_service()
    now_ts = 1000000.0
    mocker.patch("server.services.arrival_service.time", return_value=now_ts)
    mock_raw = mocker.patch.object(svc, "_get_raw_arrival_timestamp")
    mock_raw.return_value = None

    result = svc._get_earliest_updated_arrival_time("stop_1", [[]])
    assert result is None


def test_get_earliest_updated_arrival_time_filters_past(mocker):
    svc, _, _ = make_service()
    now_ts = 1000000.0
    mocker.patch("server.services.arrival_service.time", return_value=now_ts)
    past_ts = now_ts - 300  # 5 min ago
    future_ts = now_ts + 600  # 10 min from now
    mock_raw = mocker.patch.object(svc, "_get_raw_arrival_timestamp")
    mock_raw.side_effect = [past_ts, future_ts]

    result = svc._get_earliest_updated_arrival_time("stop_1", [[], []])

    tz = timezone("US/Central")
    expected = datetime.fromtimestamp(future_ts).astimezone(tz).strftime("%H:%M:%S")
    assert result == expected


def test_get_earliest_updated_arrival_time_midnight_crossing(mocker):
    """23:32 should beat 00:02 even though '00:02' < '23:32' as a string."""
    svc, _, _ = make_service()
    tz = timezone("US/Central")
    base = tz.localize(datetime(2026, 3, 3, 23, 0, 0))
    now_ts = base.timestamp()
    mocker.patch("server.services.arrival_service.time", return_value=now_ts)

    ts_2332 = tz.localize(datetime(2026, 3, 3, 23, 32, 0)).timestamp()
    ts_0002 = tz.localize(datetime(2026, 3, 4, 0, 2, 0)).timestamp()
    mock_raw = mocker.patch.object(svc, "_get_raw_arrival_timestamp")
    mock_raw.side_effect = [ts_0002, ts_2332]  # 00:02 offered first

    result = svc._get_earliest_updated_arrival_time("stop_1", [[], []])

    assert result == "23:32:00"
