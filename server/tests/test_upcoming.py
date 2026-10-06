"""Tests for the pure upcoming-arrivals logic (server/services/upcoming.py)."""

from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from google.transit.gtfs_realtime_pb2 import TripUpdate, VehiclePosition

from server.services.gtfs_rt_service import RealtimeSnapshot
from server.services.upcoming import (
    MAX_ARRIVALS,
    build_arrival,
    build_track,
    format_gtfs_time,
    gtfs_seconds,
    local_today,
    select_arrivals,
    to_epoch,
)

SERVICE_DATE = date(2026, 10, 5)
# 8:00 PM Central — already 01:00 the next day in UTC, the case the old
# server-local-time cutoff got wrong
NOW = to_epoch(SERVICE_DATE, "20:00:00")
STOP_ID = "stop_9"


def row(trip_id="t1", arrival_time="20:10:00", stop_sequence=9):
    return SimpleNamespace(
        trip_id=trip_id,
        arrival_time=arrival_time,
        departure_time=arrival_time,
        stop_sequence=stop_sequence,
        route_id="801",
        trip_headsign="801 Tech Ridge",
        direction_id=0,
        route_color="E2231A",
    )


def trip_update(trip_id="t1", predictions=None, skipped=()):
    """predictions: {stop_sequence: epoch}; skipped: sequences marked SKIPPED."""
    tu = TripUpdate()
    tu.trip.trip_id = trip_id
    for seq, at in (predictions or {}).items():
        stu = tu.stop_time_update.add()
        stu.stop_sequence = seq
        stu.stop_id = f"stop_{seq}"
        stu.arrival.time = at
    for seq in skipped:
        stu = tu.stop_time_update.add()
        stu.stop_sequence = seq
        stu.stop_id = f"stop_{seq}"
        stu.schedule_relationship = TripUpdate.StopTimeUpdate.SKIPPED
    return tu


def vehicle(trip_id="t1", current_stop_sequence=5):
    vp = VehiclePosition()
    vp.trip.trip_id = trip_id
    vp.vehicle.id = "bus-42"
    vp.position.latitude = 30.25
    vp.position.longitude = -97.74
    vp.position.bearing = 90
    vp.timestamp = NOW - 10
    vp.current_stop_sequence = current_stop_sequence
    vp.current_status = VehiclePosition.IN_TRANSIT_TO
    return vp


def snapshot(trip_updates=(), vehicles=()):
    return RealtimeSnapshot(
        trip_updates={tu.trip.trip_id: tu for tu in trip_updates},
        vehicles={vp.trip.trip_id: vp for vp in vehicles},
    )


# Time helpers


def test_gtfs_times_past_midnight_roll_into_the_next_day():
    assert to_epoch(SERVICE_DATE, "25:10:00") == to_epoch(
        SERVICE_DATE + timedelta(days=1), "01:10:00"
    )


def test_format_gtfs_time_round_trips_hours_past_24():
    assert format_gtfs_time(gtfs_seconds("25:01:02")) == "25:01:02"
    assert format_gtfs_time(-30) == "00:00:00"


def test_local_today_uses_austin_time_not_utc():
    assert datetime.fromtimestamp(NOW, timezone.utc).date() == date(2026, 10, 6)
    assert local_today(NOW) == SERVICE_DATE


# build_arrival


def test_scheduled_only_arrival():
    arrival = build_arrival(row(), SERVICE_DATE, STOP_ID, snapshot(), NOW)

    assert arrival["scheduled_at"] == NOW + 600
    assert arrival["predicted_at"] is None
    assert arrival["stops_away"] is None
    assert arrival["vehicle"] is None
    assert arrival["status"] == "scheduled"


def test_live_prediction_and_vehicle():
    rt = snapshot([trip_update(predictions={9: NOW + 420})], [vehicle()])

    arrival = build_arrival(row(), SERVICE_DATE, STOP_ID, rt, NOW)

    assert arrival["predicted_at"] == NOW + 420
    assert arrival["effective_at"] == NOW + 420
    assert arrival["stops_away"] == 4
    assert arrival["status"] == "en_route"
    assert arrival["vehicle"] == {
        "id": "bus-42",
        "lat": pytest.approx(30.25),
        "lon": pytest.approx(-97.74),
        "bearing": 90,
        "updated_at": NOW - 10,
    }


def test_bus_past_the_stop_is_dropped():
    rt = snapshot([], [vehicle(current_stop_sequence=10)])

    assert build_arrival(row(), SERVICE_DATE, STOP_ID, rt, NOW) is None


def test_prediction_is_matched_by_stop_sequence_on_loop_routes():
    # The same stop id appears at sequences 2 and 9; only 9 is ours
    tu = trip_update(predictions={2: NOW + 60, 9: NOW + 900})
    for stu in tu.stop_time_update:
        stu.stop_id = STOP_ID

    arrival = build_arrival(row(), SERVICE_DATE, STOP_ID, snapshot([tu]), NOW)

    assert arrival["predicted_at"] == NOW + 900


def test_skipped_stop_has_no_prediction():
    rt = snapshot([trip_update(skipped=[9])])

    arrival = build_arrival(row(), SERVICE_DATE, STOP_ID, rt, NOW)

    assert arrival["predicted_at"] is None
    assert arrival["status"] == "scheduled"


@pytest.mark.parametrize(
    "seconds_left, current_seq, expected",
    [
        (45, 5, "arriving"),  # due within a minute
        (150, 9, "arriving"),  # heading to this very stop, under 3 min
        (150, 8, "en_route"),  # one stop out (e.g. a layover) is not enough
        (240, 9, "en_route"),  # next stop but still 4 min out
    ],
)
def test_arriving_status(seconds_left, current_seq, expected):
    rt = snapshot(
        [trip_update(predictions={9: NOW + seconds_left})],
        [vehicle(current_stop_sequence=current_seq)],
    )

    arrival = build_arrival(row(), SERVICE_DATE, STOP_ID, rt, NOW)

    assert arrival["status"] == expected


def test_overdue_live_bus_stays_arriving_during_grace():
    rt = snapshot([trip_update(predictions={9: NOW - 120})], [vehicle()])

    arrival = build_arrival(row(), SERVICE_DATE, STOP_ID, rt, NOW)

    assert arrival["status"] == "arriving"


def test_overdue_live_bus_drops_after_grace():
    rt = snapshot([trip_update(predictions={9: NOW - 240})], [vehicle()])

    assert build_arrival(row(), SERVICE_DATE, STOP_ID, rt, NOW) is None


def test_overdue_scheduled_bus_is_dropped():
    late = row(arrival_time="19:58:00")

    assert build_arrival(late, SERVICE_DATE, STOP_ID, snapshot(), NOW) is None


def test_late_bus_scheduled_earlier_is_kept_by_its_prediction():
    late = row(arrival_time="19:40:00")
    rt = snapshot([trip_update(predictions={9: NOW + 300})])

    arrival = build_arrival(late, SERVICE_DATE, STOP_ID, rt, NOW)

    assert arrival["effective_at"] == NOW + 300


def test_beyond_the_hour_is_dropped():
    far = row(arrival_time="21:01:00")

    assert build_arrival(far, SERVICE_DATE, STOP_ID, snapshot(), NOW) is None


def test_select_arrivals_orders_by_effective_time_and_caps():
    candidates = [
        {"effective_at": NOW + i * 60, "scheduled_at": NOW + i * 60}
        for i in reversed(range(MAX_ARRIVALS + 3))
    ]

    selected = select_arrivals(candidates)

    assert len(selected) == MAX_ARRIVALS
    assert [a["effective_at"] for a in selected] == sorted(
        a["effective_at"] for a in selected
    )


# build_track


def trip_stop_times(count=12):
    """Stops 1..count, scheduled a minute apart from 20:00."""
    return [
        SimpleNamespace(
            stop_sequence=seq,
            arrival_time=format_gtfs_time(gtfs_seconds("20:00:00") + seq * 60),
            stop=SimpleNamespace(
                stop_id=f"stop_{seq}",
                stop_name=f"Stop {seq}",
                stop_loc='{"type":"Point","coordinates":[-97.7,30.2]}',
            ),
        )
        for seq in range(1, count + 1)
    ]


def test_track_uses_predictions_and_propagates_delay():
    sched = {st.stop_sequence: st for st in trip_stop_times()}
    # Stop 5 predicted 2 min late; stops 6-7 have no prediction
    tu = trip_update(predictions={5: to_epoch(SERVICE_DATE, "20:07:00")})

    track = build_track(trip_stop_times(), SERVICE_DATE, 5, 7, tu)

    assert [s["stop_sequence"] for s in track] == [5, 6, 7]
    assert track[0]["is_vehicle_here"] is True
    assert track[0]["at"] == to_epoch(SERVICE_DATE, "20:07:00")
    assert track[2]["at"] == to_epoch(SERVICE_DATE, sched[7].arrival_time) + 120


def test_track_backfills_delay_before_the_first_prediction():
    tu = trip_update(predictions={6: to_epoch(SERVICE_DATE, "20:09:00")})

    track = build_track(trip_stop_times(), SERVICE_DATE, 5, 6, tu)

    # Stop 5 is scheduled 20:05; the first known delay (+3 min) applies
    assert track[0]["at"] == to_epoch(SERVICE_DATE, "20:08:00")


def test_long_track_keeps_head_and_rider_stop():
    track = build_track(trip_stop_times(), SERVICE_DATE, 1, 12, None)

    assert [s["stop_sequence"] for s in track] == [1, 2, 3, 4, 5, 6, 12]
    assert track[-1]["stops_hidden_before"] == 5
    assert all(s["stops_hidden_before"] == 0 for s in track[:-1])
