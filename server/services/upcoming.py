"""Pure logic for the "upcoming buses at a stop" view.

Kept free of I/O so the time math, live matching and status rules can be
tested with plain values; ArrivalService.get_upcoming does the fetching.

All times are epoch seconds. GTFS schedule times ("HH:MM:SS", possibly past
24:00:00) are relative to the start of their service day in Austin.
"""

from datetime import date, datetime, time, timedelta
from typing import List, Optional, Sequence

from google.transit.gtfs_realtime_pb2 import TripUpdate, VehiclePosition
from pytz import timezone

from server.services.gtfs_rt_service import RealtimeSnapshot

CENTRAL = timezone("America/Chicago")

# Schedule rows are fetched this far into the past so late buses (whose
# prediction is still ahead) are not missed
SCHEDULE_LOOKBACK_SECONDS = 30 * 60
WINDOW_PAST_SECONDS = 60
WINDOW_AHEAD_SECONDS = 60 * 60
MAX_ARRIVALS = 12
ARRIVING_SECONDS = 60
# Heading to this very stop and at most this far out also reads "arriving"
ARRIVING_NEXT_STOP_SECONDS = 3 * 60
# A live bus whose prediction has passed stays "arriving" this long, unless
# its vehicle is already past the stop
ARRIVING_GRACE_SECONDS = 3 * 60
# Tracks longer than this keep the vehicle's stop, the next TRACK_HEAD_STOPS
# and the rider's stop
TRACK_MAX_STOPS = 8
TRACK_HEAD_STOPS = 5

_SKIPPED = TripUpdate.StopTimeUpdate.SKIPPED


def gtfs_seconds(hhmmss: str) -> int:
    hours, minutes, seconds = (int(part) for part in hhmmss.split(":"))
    return hours * 3600 + minutes * 60 + seconds


def format_gtfs_time(seconds: int) -> str:
    """Inverse of gtfs_seconds; hours may exceed 23."""
    seconds = max(seconds, 0)
    return f"{seconds // 3600:02d}:{seconds % 3600 // 60:02d}:{seconds % 60:02d}"


def service_day_start(service_date: date) -> datetime:
    return CENTRAL.localize(datetime.combine(service_date, time()))


def to_epoch(service_date: date, hhmmss: str) -> int:
    start = service_day_start(service_date)
    return int((start + timedelta(seconds=gtfs_seconds(hhmmss))).timestamp())


def local_today(now: int) -> date:
    return datetime.fromtimestamp(now, CENTRAL).date()


def seconds_into_service_day(service_date: date, now: int) -> int:
    return now - int(service_day_start(service_date).timestamp())


def find_stop_time_update(
    trip_update: Optional[TripUpdate], stop_sequence: int, stop_id: str
) -> Optional[TripUpdate.StopTimeUpdate]:
    """The update for one stop of a trip, matched by sequence when given.

    Sequence is preferred because loop routes visit the same stop twice.
    """
    if trip_update is None:
        return None
    for stu in trip_update.stop_time_update:
        if stu.HasField("stop_sequence"):
            if stu.stop_sequence == stop_sequence:
                return stu
        elif stu.stop_id == stop_id:
            return stu
    return None


def event_time(stu: Optional[TripUpdate.StopTimeUpdate]) -> Optional[int]:
    """Predicted arrival (else departure) time, or None for no prediction."""
    if stu is None or stu.schedule_relationship == _SKIPPED:
        return None
    if stu.HasField("arrival") and stu.arrival.time:
        return stu.arrival.time
    if stu.HasField("departure") and stu.departure.time:
        return stu.departure.time
    return None


def vehicle_stop_sequence(vehicle: Optional[VehiclePosition]) -> Optional[int]:
    if vehicle is None or not vehicle.HasField("current_stop_sequence"):
        return None
    return vehicle.current_stop_sequence


def classify_status(
    now: int, effective_at: int, is_live: bool, stops_away: Optional[int]
) -> str:
    """Time-driven: a bus held at the previous stop (layover) can still be
    minutes out, so stop distance alone never makes it "arriving"."""
    if not is_live:
        return "scheduled"
    seconds_left = effective_at - now
    if seconds_left <= ARRIVING_SECONDS:
        return "arriving"
    if stops_away == 0 and seconds_left <= ARRIVING_NEXT_STOP_SECONDS:
        return "arriving"
    return "en_route"


def vehicle_payload(vehicle: VehiclePosition) -> dict:
    return {
        "id": vehicle.vehicle.id,
        "lat": vehicle.position.latitude,
        "lon": vehicle.position.longitude,
        "bearing": vehicle.position.bearing,
        "updated_at": vehicle.timestamp or None,
    }


def build_arrival(
    row, service_date: date, stop_id: str, snapshot: RealtimeSnapshot, now: int
) -> Optional[dict]:
    """One upcoming arrival from a schedule row, or None to leave it out.

    Dropped: buses whose vehicle is past this stop, buses outside the
    window, and scheduled-only buses already due.
    """
    scheduled_at = to_epoch(service_date, row.arrival_time)
    trip_update = snapshot.trip_updates.get(row.trip_id)
    predicted_at = event_time(
        find_stop_time_update(trip_update, row.stop_sequence, stop_id)
    )
    vehicle = snapshot.vehicles.get(row.trip_id)
    vehicle_seq = vehicle_stop_sequence(vehicle)
    if vehicle_seq is None:
        vehicle = None
        stops_away = None
    else:
        stops_away = row.stop_sequence - vehicle_seq
        if stops_away < 0:
            return None

    effective_at = predicted_at if predicted_at is not None else scheduled_at
    is_live = predicted_at is not None or vehicle is not None
    if effective_at > now + WINDOW_AHEAD_SECONDS:
        return None
    if effective_at < now - WINDOW_PAST_SECONDS:
        if not is_live or effective_at < now - ARRIVING_GRACE_SECONDS:
            return None
        status = "arriving"
    else:
        status = classify_status(now, effective_at, is_live, stops_away)

    return {
        "trip_id": row.trip_id,
        "route_id": row.route_id,
        "route_color": row.route_color,
        "headsign": row.trip_headsign,
        "direction_id": row.direction_id,
        "stop_sequence": row.stop_sequence,
        "service_date": service_date,
        "scheduled_at": scheduled_at,
        "predicted_at": predicted_at,
        "stops_away": stops_away,
        "status": status,
        "vehicle": vehicle_payload(vehicle) if vehicle is not None else None,
        "vehicle_stop_sequence": vehicle_seq,
        "track": [],
        "effective_at": effective_at,
    }


def build_track(
    trip_stop_times: Sequence,
    service_date: date,
    vehicle_seq: int,
    target_seq: int,
    trip_update: Optional[TripUpdate],
) -> List[dict]:
    """Stops from the vehicle's current stop through the rider's stop.

    Each stop's time is its own prediction when the feed has one; otherwise
    the schedule shifted by the nearest known delay (the latest one before
    it, else the first one after it, else none).
    """
    segment = [
        st for st in trip_stop_times if vehicle_seq <= st.stop_sequence <= target_seq
    ]
    scheduled = [to_epoch(service_date, st.arrival_time) for st in segment]
    predicted = [
        event_time(
            find_stop_time_update(trip_update, st.stop_sequence, st.stop.stop_id)
        )
        for st in segment
    ]
    known_delays = [p - s for p, s in zip(predicted, scheduled) if p is not None]
    delay = known_delays[0] if known_delays else 0

    stops = []
    for st, sched, pred in zip(segment, scheduled, predicted):
        if pred is not None:
            delay = pred - sched
        stops.append(
            {
                "stop_id": st.stop.stop_id,
                "stop_name": st.stop.stop_name,
                "stop_sequence": st.stop_sequence,
                "stop_loc": st.stop.stop_loc,
                "at": pred if pred is not None else sched + delay,
                "is_vehicle_here": st.stop_sequence == vehicle_seq,
                "stops_hidden_before": 0,
            }
        )

    if len(stops) > TRACK_MAX_STOPS:
        head = stops[: TRACK_HEAD_STOPS + 1]
        last = dict(stops[-1], stops_hidden_before=len(stops) - len(head) - 1)
        stops = head + [last]
    return stops


def select_arrivals(candidates: List[dict]) -> List[dict]:
    """Soonest first, capped. Ties keep schedule order."""
    ordered = sorted(candidates, key=lambda a: (a["effective_at"], a["scheduled_at"]))
    return ordered[:MAX_ARRIVALS]
