"""Tests for the arrival time merging service (ported from the former
GraphQL resolver tests)."""

import pytest
from datetime import date, datetime, timedelta
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


# get_upcoming


def upcoming_row(trip_id, arrival_time, stop_sequence=3):
    return SimpleNamespace(
        trip_id=trip_id,
        arrival_time=arrival_time,
        departure_time=arrival_time,
        stop_sequence=stop_sequence,
        route_id="7",
        trip_headsign="7 Duval",
        direction_id=1,
        route_color="2E7D32",
    )


def upcoming_trip_stop_times():
    return [
        SimpleNamespace(
            stop_sequence=seq,
            arrival_time=f"20:0{seq}:00",
            stop=SimpleNamespace(stop_id=f"s{seq}", stop_name=f"S{seq}", stop_loc=None),
        )
        for seq in (1, 2, 3)
    ]


def make_upcoming_service(snapshot):
    svc, gtfs_service, rt_service = make_service()
    gtfs_service.get_stop.return_value = SimpleNamespace(stop_id="s3", stop_name="S3")
    gtfs_service.get_routes_at_stop.return_value = []
    gtfs_service.get_stop_times_by_trip_id.return_value = upcoming_trip_stop_times()
    rt_service.get_snapshot = AsyncMock(return_value=snapshot)
    return svc, gtfs_service


@pytest.mark.asyncio
async def test_get_upcoming_queries_today_and_yesterdays_late_service():
    from server.services.gtfs_rt_service import RealtimeSnapshot
    from server.services.upcoming import to_epoch

    svc, gtfs_service = make_upcoming_service(RealtimeSnapshot())
    gtfs_service.get_stop_times_at_stop_in_window.return_value = []
    today = date(2026, 10, 5)
    now = to_epoch(today, "20:00:00")

    await svc.get_upcoming("s3", now=now)

    windows = [
        c.args[1:4]
        for c in gtfs_service.get_stop_times_at_stop_in_window.call_args_list
    ]
    assert windows[:2] == [
        (date(2026, 10, 4), "43:30:00", "45:00:00"),
        (today, "19:30:00", "21:00:00"),
    ]


@pytest.mark.asyncio
async def test_get_upcoming_counts_stops_away_and_builds_track():
    from google.transit.gtfs_realtime_pb2 import VehiclePosition
    from server.services.gtfs_rt_service import RealtimeSnapshot
    from server.services.upcoming import to_epoch

    vp = VehiclePosition()
    vp.trip.trip_id = "t1"
    vp.vehicle.id = "bus-1"
    vp.current_stop_sequence = 1
    svc, gtfs_service = make_upcoming_service(RealtimeSnapshot(vehicles={"t1": vp}))
    gtfs_service.get_stop_times_at_stop_in_window.side_effect = [
        [],
        [upcoming_row("t1", "20:03:00")],
    ]
    now = to_epoch(date(2026, 10, 5), "20:00:00")

    result = await svc.get_upcoming("s3", now=now)

    (arrival,) = result["arrivals"]
    assert arrival["stops_away"] == 2
    assert [s["stop_sequence"] for s in arrival["track"]] == [1, 2, 3]
    assert result["realtime_available"] is True
    assert result["next_scheduled"] is None
    gtfs_service.get_stop_times_by_trip_id.assert_awaited_once_with("t1")


@pytest.mark.asyncio
async def test_get_upcoming_falls_back_to_next_scheduled_and_reports_rt_down():
    from server.services.gtfs_rt_service import RealtimeSnapshot
    from server.services.upcoming import to_epoch

    svc, gtfs_service = make_upcoming_service(RealtimeSnapshot(available=False))
    gtfs_service.get_stop_times_at_stop_in_window.side_effect = [
        [],  # yesterday's late service
        [],  # today's window
        [],  # rest of today
        [upcoming_row("t9", "05:42:00")],  # tomorrow
    ]
    today = date(2026, 10, 5)
    now = to_epoch(today, "23:30:00")

    result = await svc.get_upcoming("s3", now=now)

    assert result["arrivals"] == []
    assert result["realtime_available"] is False
    assert result["next_scheduled"]["trip_id"] == "t9"
    assert result["next_scheduled"]["scheduled_at"] == to_epoch(
        today + timedelta(days=1), "05:42:00"
    )
