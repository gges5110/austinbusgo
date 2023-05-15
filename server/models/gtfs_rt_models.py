# GTFS real time reference: https://developers.google.com/transit/gtfs-realtime/reference


# A descriptor that identifies a single instance of a GTFS trip.
class TripDescriptor:
    trip_id: str
    route_id: str
    direction_id: int
    start_time: str
    start_date: str
    schedule_relationship: str


# A geographic position of a vehicle.
class Position:
    latitude: float
    longitude: float
    bearing: float
    speed: float


# Identification information for the vehicle performing the trip.
class VehicleDescriptor:
    id: str
    label: str


# Realtime positioning information for a given vehicle.
class VehiclePosition:
    def __getitem__(self, key):
        return self[key]

    trip: TripDescriptor
    vehicle: VehicleDescriptor
    position: Position
    current_stop_sequence: int
    stop_id: str
    current_status: int  # VehicleStopStatus
    timestamp: int
    congestion_level: int  # CongestionLevel


# Timing information for a single predicted event (either arrival or departure). Timing consists of delay and/or
# estimated time, and uncertainty.
class StopTimeEvent:
    delay: int
    time: int
    uncertainty: int


# Realtime update for arrival and/or departure events for a given stop on a trip.
class StopTimeUpdate:
    stop_sequence: int
    stop_id: str
    arrival: StopTimeEvent
    departure: StopTimeEvent
    schedule_relationship: int  # ScheduleRelationship


# Realtime update on the progress of a vehicle along a trip.
class TripUpdate:
    def __getitem__(self, key):
        return self[key]

    trip: TripDescriptor
    vehicle: VehicleDescriptor
    stop_time_update: [StopTimeUpdate]
    timestamp: int
    delay: int


# A definition (or update) of an entity in the transit feed. If the entity is not being deleted, exactly one of
# 'trip_update', 'vehicle' and 'alert' fields should be populated.
class FeedEntity:
    def __getitem__(self, key):
        return self[key]

    id: str
    trip_update: TripUpdate
    vehicle: VehiclePosition


# Metadata about a feed, included in feed messages.
class FeedHeader:
    gtfs_realtime_version: str
    incrementality: str
    timestamp: float


# The contents of a feed message. Each message in the stream is obtained as a response to an appropriate HTTP GET
# request. A realtime feed is always defined with relation to an existing GTFS feed. All the entity ids are resolved
# with respect to the GTFS feed.
class FeedMessage:
    header: FeedHeader
    entity: [FeedEntity]
