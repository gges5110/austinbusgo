"""Pydantic response models for the REST API.

Field names serialize as camelCase (matching the former GraphQL responses)
so client components keep reading the same JSON shapes.
"""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel

from server.services.geometry import geom_to_dict

_VEHICLE_STOP_STATUS_MAP = {0: "INCOMING_AT", 1: "STOPPED_AT", 2: "IN_TRANSIT_TO"}


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )


class Point(ApiModel):
    type: str
    coordinates: List[float]


class LineString(ApiModel):
    type: str
    coordinates: List[List[float]]


class Route(ApiModel):
    route_id: str
    agency_id: Optional[str] = None
    route_short_name: Optional[str] = None
    route_long_name: str
    route_color: Optional[str] = None


class Stop(ApiModel):
    stop_id: str
    stop_code: Optional[str] = None
    stop_name: Optional[str] = None
    stop_desc: Optional[str] = None
    stop_url: Optional[str] = None
    wheelchair_boarding: Optional[int] = None
    on_street: Optional[str] = None
    at_street: Optional[str] = None
    stop_loc: Optional[Point] = None
    routes: List[Route] = []

    @field_validator("stop_loc", mode="before")
    @classmethod
    def _parse_geom(cls, value):
        return geom_to_dict(value)


class Trip(ApiModel):
    route_id: str
    service_id: str
    trip_id: str
    trip_headsign: Optional[str] = None
    direction_id: Optional[int] = None
    block_id: Optional[str] = None
    shape_id: Optional[str] = None
    scheduled_trip_id: Optional[str] = None
    trip_short_name: Optional[str] = None
    wheelchair_accessible: Optional[int] = None
    bikes_allowed: Optional[int] = None
    route: Optional[Route] = None


class StopTime(ApiModel):
    trip_id: str
    arrival_time: str
    departure_time: str
    stop_id: str
    stop_sequence: int
    pickup_type: Optional[int] = None
    drop_off_type: Optional[int] = None
    shape_dist_traveled: Optional[float] = None
    timepoint: Optional[int] = None
    stop: Optional[Stop] = None


class ArrivalTime(ApiModel):
    scheduled_arrival_time: str
    updated_arrival_time: Optional[str] = None
    trip: Trip


class ArrivalTimeAtStop(ApiModel):
    stop_id: str
    stop_sequence: int
    scheduled_arrival_time: str
    trip_id: Optional[str] = None
    updated_arrival_time: Optional[str] = None


class StopsAndShapes(ApiModel):
    stops: List[Stop]
    shapes: List[LineString]
    distinct_trips: List[Trip]


class SearchResult(ApiModel):
    stops: List[Stop]
    routes: List[Route]


class TripIds(ApiModel):
    trip_ids: List[str]


class FeedInfo(ApiModel):
    feed_publisher_name: str
    feed_publisher_url: str
    feed_lang: str
    feed_start_date: Optional[str] = None
    feed_end_date: Optional[str] = None
    feed_version: Optional[str] = None


# GTFS-RT models (https://developers.google.com/transit/gtfs-realtime/reference)


class TripDescriptor(ApiModel):
    trip_id: Optional[str] = None
    start_date: Optional[str] = None
    start_time: Optional[str] = None
    route_id: Optional[str] = None

    @classmethod
    def from_proto(cls, proto) -> "TripDescriptor":
        return cls(
            trip_id=proto.trip_id or None,
            start_date=proto.start_date or None,
            start_time=proto.start_time or None,
            route_id=proto.route_id or None,
        )


class VehicleDescriptor(ApiModel):
    id: Optional[str] = None
    label: Optional[str] = None
    license_plate: Optional[str] = None

    @classmethod
    def from_proto(cls, proto) -> "VehicleDescriptor":
        return cls(
            id=proto.id or None,
            label=proto.label or None,
            license_plate=proto.license_plate or None,
        )


class Position(ApiModel):
    latitude: float
    longitude: float
    bearing: Optional[float] = None
    speed: Optional[float] = None

    @classmethod
    def from_proto(cls, proto) -> "Position":
        return cls(
            latitude=proto.latitude,
            longitude=proto.longitude,
            bearing=proto.bearing or None,
            speed=proto.speed or None,
        )


class VehiclePosition(ApiModel):
    trip: Optional[TripDescriptor] = None
    vehicle: Optional[VehicleDescriptor] = None
    position: Optional[Position] = None
    current_stop_sequence: Optional[int] = None
    stop_id: Optional[str] = None
    current_status: Optional[str] = None
    timestamp: Optional[int] = None
    congestion_level: Optional[int] = None

    @classmethod
    def from_proto(cls, proto) -> "VehiclePosition":
        return cls(
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
            current_status=_VEHICLE_STOP_STATUS_MAP.get(proto.current_status),
            timestamp=proto.timestamp or None,
            congestion_level=proto.congestion_level or None,
        )


class StopTimeEvent(ApiModel):
    delay: Optional[int] = None
    time: Optional[int] = None
    uncertainty: Optional[int] = None

    @classmethod
    def from_proto(cls, proto) -> "StopTimeEvent":
        return cls(
            delay=proto.delay or None,
            time=proto.time or None,
            uncertainty=proto.uncertainty or None,
        )


class StopTimeUpdate(ApiModel):
    stop_sequence: Optional[int] = None
    stop_id: Optional[str] = None
    arrival: Optional[StopTimeEvent] = None
    departure: Optional[StopTimeEvent] = None
    schedule_relationship: Optional[int] = None

    @classmethod
    def from_proto(cls, proto) -> "StopTimeUpdate":
        return cls(
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


class TripUpdate(ApiModel):
    trip: TripDescriptor
    vehicle: VehicleDescriptor
    stop_time_update: List[StopTimeUpdate]
    timestamp: int
    delay: Optional[int] = None

    @classmethod
    def from_proto(cls, proto) -> "TripUpdate":
        return cls(
            trip=TripDescriptor.from_proto(proto.trip),
            vehicle=VehicleDescriptor.from_proto(proto.vehicle),
            stop_time_update=[
                StopTimeUpdate.from_proto(stu) for stu in proto.stop_time_update
            ],
            timestamp=proto.timestamp,
            delay=proto.delay or None,
        )
