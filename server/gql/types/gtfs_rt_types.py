# https://developers.google.com/transit/gtfs-realtime/reference
import enum
from typing import List, Optional

import strawberry

_VEHICLE_STOP_STATUS_MAP = {0: "INCOMING_AT", 1: "STOPPED_AT", 2: "IN_TRANSIT_TO"}


@strawberry.enum
class VehicleStopStatus(enum.Enum):
    INCOMING_AT = "INCOMING_AT"
    STOPPED_AT = "STOPPED_AT"
    IN_TRANSIT_TO = "IN_TRANSIT_TO"


@strawberry.type
class TripDescriptor:
    """A descriptor that identifies a single instance of a GTFS trip."""

    trip_id: Optional[str] = None
    start_date: Optional[str] = None
    start_time: Optional[str] = None
    route_id: Optional[str] = None

    @staticmethod
    def from_proto(proto) -> "TripDescriptor":
        return TripDescriptor(
            trip_id=proto.trip_id or None,
            start_date=proto.start_date or None,
            start_time=proto.start_time or None,
            route_id=proto.route_id or None,
        )


@strawberry.type
class VehicleDescriptor:
    """Identification information for the vehicle performing the trip."""

    id: Optional[str] = None
    label: Optional[str] = None
    license_plate: Optional[str] = None

    @staticmethod
    def from_proto(proto) -> "VehicleDescriptor":
        return VehicleDescriptor(
            id=proto.id or None,
            label=proto.label or None,
            license_plate=proto.license_plate or None,
        )


@strawberry.type
class Position:
    """A geographic position of a vehicle."""

    latitude: float
    longitude: float
    bearing: Optional[float] = None
    speed: Optional[float] = None

    @staticmethod
    def from_proto(proto) -> "Position":
        return Position(
            latitude=proto.latitude,
            longitude=proto.longitude,
            bearing=proto.bearing or None,
            speed=proto.speed or None,
        )


@strawberry.type
class VehiclePosition:
    """Realtime positioning information for a given vehicle."""

    trip: Optional[TripDescriptor] = None
    vehicle: Optional[VehicleDescriptor] = None
    position: Optional[Position] = None
    current_stop_sequence: Optional[int] = None
    stop_id: Optional[str] = None
    current_status: Optional[VehicleStopStatus] = None
    timestamp: Optional[int] = None
    congestion_level: Optional[int] = None

    @staticmethod
    def from_proto(proto) -> "VehiclePosition":
        status_str = _VEHICLE_STOP_STATUS_MAP.get(proto.current_status)
        return VehiclePosition(
            trip=(
                TripDescriptor.from_proto(proto.trip)
                if proto.HasField("trip")
                else None
            ),
            vehicle=(
                VehicleDescriptor.from_proto(proto.vehicle)
                if proto.HasField("vehicle")
                else None
            ),
            position=(
                Position.from_proto(proto.position)
                if proto.HasField("position")
                else None
            ),
            current_stop_sequence=proto.current_stop_sequence or None,
            stop_id=proto.stop_id or None,
            current_status=VehicleStopStatus(status_str) if status_str else None,
            timestamp=proto.timestamp or None,
            congestion_level=proto.congestion_level or None,
        )


@strawberry.type
class StopTimeEvent:
    delay: Optional[int] = None
    time: Optional[int] = None
    uncertainty: Optional[int] = None

    @staticmethod
    def from_proto(proto) -> "StopTimeEvent":
        return StopTimeEvent(
            delay=proto.delay or None,
            time=proto.time or None,
            uncertainty=proto.uncertainty or None,
        )


@strawberry.type
class StopTimeUpdate:
    stop_sequence: Optional[int] = None
    stop_id: Optional[str] = None
    arrival: Optional[StopTimeEvent] = None
    departure: Optional[StopTimeEvent] = None
    schedule_relationship: Optional[int] = None

    @staticmethod
    def from_proto(proto) -> "StopTimeUpdate":
        return StopTimeUpdate(
            stop_sequence=proto.stop_sequence or None,
            stop_id=proto.stop_id or None,
            arrival=(
                StopTimeEvent.from_proto(proto.arrival)
                if proto.HasField("arrival")
                else None
            ),
            departure=(
                StopTimeEvent.from_proto(proto.departure)
                if proto.HasField("departure")
                else None
            ),
            schedule_relationship=proto.schedule_relationship or None,
        )


@strawberry.type
class TripUpdate:
    """Realtime update on the progress of a vehicle along a trip."""

    trip: TripDescriptor
    vehicle: VehicleDescriptor
    stop_time_update: List[StopTimeUpdate]
    timestamp: int
    delay: Optional[int] = None

    @staticmethod
    def from_proto(proto) -> "TripUpdate":
        return TripUpdate(
            trip=TripDescriptor.from_proto(proto.trip),
            vehicle=VehicleDescriptor.from_proto(proto.vehicle),
            stop_time_update=[
                StopTimeUpdate.from_proto(stu) for stu in proto.stop_time_update
            ],
            timestamp=proto.timestamp,
            delay=proto.delay or None,
        )
