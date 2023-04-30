import graphene

from server.gql.resolver import Resolver


class Route(graphene.ObjectType):
    route_id = graphene.Int(description='Identifies a route.', required=True)
    agency_id = graphene.Int(description='Agency for the specified route.')
    route_short_name = graphene.String(description='Short name of a route.')
    route_long_name = graphene.String(description='Full name of a route.', required=True)
    route_color = graphene.String(description='Route color designation that matches public facing material.')
    route_desc = graphene.String(description='Description of a route that provides useful, quality information.')


class Stop(graphene.ObjectType):
    stop_id = graphene.Int(
        description='Identifies a stop, station, or station entrance.', required=True)
    stop_code = graphene.String(
        description='Short text or a number that identifies the location for riders.')
    stop_name = graphene.String(description='Name of the location. Use a name that people will understand in the '
                                            'local and tourist vernacular.')
    stop_lat = graphene.Float(description='Latitude of the location.')
    stop_lon = graphene.Float(description='Longitude of the location.')


class Shape(graphene.ObjectType):
    shape_id = graphene.String(
        description='Identifies a shape.', required=True)
    shape_pt_lat = graphene.Float(description='Latitude of a shape point. Each record in shapes.txt represents a '
                                              'shape point used to define the shape.', required=True)
    shape_pt_lon = graphene.Float(
        description='Longitude of a shape point.', required=True)


# https://developers.google.com/transit/gtfs-realtime/reference

class TripDescriptor(graphene.ObjectType):
    """A descriptor that identifies a single instance of a GTFS trip."""
    trip_id = graphene.String(
        description='The trip_id from the GTFS feed that this selector refers to.')
    start_date = graphene.String(
        description='The start date of this trip instance in YYYYMMDD format.')
    start_time = graphene.String(description='The initially scheduled start time of this trip instance. The field '
                                             'type Time defines the format of this field, for example 11:15:35 or '
                                             '25:15:35.')
    route_id = graphene.String(description='The route_id from the GTFS feed that this selector refers to. If trip_id '
                                           'is omitted, then route_id, direction_id, start_time, '
                                           'and schedule_relationship=SCHEDULED must all be set to identify a trip '
                                           'instance.')
    # direction_id is omitted in Capital Metro's feed.


# Identification information for the vehicle performing the trip.
class VehicleDescriptor(graphene.ObjectType):
    id = graphene.String(description='Internal system identification of the vehicle. Should be unique per vehicle, '
                                     'and is used for tracking the vehicle as it proceeds through the system. This id '
                                     'should not be made visible to the end-user; for that purpose use the label '
                                     'field',
                         required=False)
    label = graphene.String(description='User visible label, i.e., something that must be shown to the passenger to '
                                        'help identify the correct vehicle.',
                            required=False)
    license_plate = graphene.String(description='The license plate of the vehicle.',
                                    required=False)


# A geographic position of a vehicle.
class Position(graphene.ObjectType):
    latitude = graphene.Float(
        description='Degrees North, in the WGS-84 coordinate system.', required=True)
    longitude = graphene.Float(
        description='Degrees East, in the WGS-84 coordinate system.', required=True)
    bearing = graphene.Float(description='Bearing, in degrees, clockwise from True North, i.e., 0 is North and 90 is '
                                         'East. This can be the compass bearing, or the direction towards the next '
                                         'stop or intermediate location. This should not be deduced from the sequence '
                                         'of previous positions, which clients can compute from previous data.')
    speed = graphene.Float(
        description='Momentary speed measured by the vehicle, in meters per second.')


class VehicleStopStatus(graphene.Enum):
    INCOMING_AT = 0
    STOPPED_AT = 1
    IN_TRANSIT_TO = 2

    @property
    def description(self):
        if self == VehicleStopStatus.INCOMING_AT:
            return 'The vehicle is just about to arrive at the stop (on a stop display, the vehicle symbol typically ' \
                   'flashes). '
        elif self == VehicleStopStatus.STOPPED_AT:
            return 'The vehicle is standing at the stop.'
        elif self == VehicleStopStatus.IN_TRANSIT_TO:
            return 'The vehicle has departed the previous stop and is in transit.'
        return 'Other episode'


# Realtime positioning information for a given vehicle.
class VehiclePosition(graphene.ObjectType):
    trip = graphene.Field(TripDescriptor, description='The Trip that this vehicle is serving. Can be empty or partial '
                                                      'if the vehicle can not be identified with a given trip '
                                                      'instance.')
    vehicle = graphene.Field(VehicleDescriptor, description='Additional information on the vehicle that is serving '
                                                            'this trip. Each entry should have a unique vehicle id.')
    position = graphene.Field(
        Position, description='Current position of this vehicle.')
    current_stop_sequence = graphene.Int(description='The stop sequence index of the current stop. The meaning of '
                                                     'current_stop_sequence (i.e., the stop that it refers to) is '
                                                     'determined by current_status. If current_status is missing '
                                                     'IN_TRANSIT_TO is assumed.')
    stop_id = graphene.String(description='Identifies the current stop. The value must be the same as in stops.txt in '
                                          'the corresponding GTFS feed.')
    current_status = VehicleStopStatus(description='The exact status of the vehicle with respect to the current stop. '
                                                   'Ignored if current_stop_sequence is missing.')
    timestamp = graphene.Int(description='Moment at which the vehicle\'s position was measured. In POSIX time (i.e., '
                                         'number of seconds since January 1st 1970 00:00:00 UTC).')
    congestion_level = graphene.Int()


# Timing information for a single predicted event (either arrival or departure). Timing consists of delay and/or
# estimated time, and uncertainty.
class StopTimeEvent(graphene.ObjectType):
    delay = graphene.Int()
    time = graphene.Int()
    uncertainty = graphene.Int()


# Realtime update for arrival and/or departure events for a given stop on a trip.
class StopTimeUpdate(graphene.ObjectType):
    stop_sequence = graphene.Int(
        description='Must be the same as in stop_times.txt in the corresponding GTFS feed.')
    stop_id = graphene.String(
        description='Must be the same as in stops.txt in the corresponding GTFS feed.')
    arrival = graphene.Field(StopTimeEvent, description='If schedule_relationship is empty or SCHEDULED, either '
                                                        'arrival or departure must be provided within a '
                                                        'StopTimeUpdate - both fields cannot be empty. arrival and '
                                                        'departure may both be empty when schedule_relationship is '
                                                        'SKIPPED. If schedule_relationship is NO_DATA, arrival and '
                                                        'departure must be empty.')
    departure = graphene.Field(StopTimeEvent, description='If schedule_relationship is empty or SCHEDULED, either '
                                                          'arrival or departure must be provided within a '
                                                          'StopTimeUpdate - both fields cannot be empty. arrival and '
                                                          'departure may both be empty when schedule_relationship is '
                                                          'SKIPPED. If schedule_relationship is NO_DATA, arrival and '
                                                          'departure must be empty.')
    schedule_relationship = graphene.Int()


# Realtime update on the progress of a vehicle along a trip.
class TripUpdate(graphene.ObjectType):
    trip = graphene.Field(TripDescriptor, required=True)
    vehicle = graphene.Field(VehicleDescriptor, required=True)
    stop_time_update = graphene.Field(
        graphene.List(StopTimeUpdate), required=True)
    timestamp = graphene.Int(required=True)
    delay = graphene.Int()


# A definition (or update) of an entity in the transit feed. If the entity is not being deleted, exactly one of
# 'trip_update', 'vehicle' and 'alert' fields should be populated.
class FeedEntity(graphene.ObjectType):
    id = graphene.String(description='Feed-unique identifier for this entity. The ids are used only to provide '
                                     'incrementality support. The actual entities referenced by the feed must be '
                                     'specified by explicit selectors (see EntitySelector below for more info).',
                         required=False)
    vehicle = graphene.Field(VehiclePosition, description='Data about the realtime position of a vehicle. At least '
                                                          'one of the fields trip_update, vehicle, or alert must be '
                                                          'provided - all these fields cannot be empty.')
    trip_update = graphene.Field(TripUpdate, description='Data about the realtime departure delays of a trip. At '
                                                         'least one of the fields trip_update, vehicle, or alert must'
                                                         ' be provided - all these fields cannot be empty.')


class Trip(graphene.ObjectType):
    route_id = graphene.String(description="Identifies a route.", required=True)
    service_id = graphene.String(description="Identifies a set of dates when service is available for one or more "
                                             "routes.", required=True)
    trip_id = graphene.String(description="Identifies a trip.", required=True)
    trip_headsign = graphene.String(description="Text that appears on signage identifying the trip's destination to "
                                                "riders.")
    trip_short_name = graphene.String(description="Public facing text used to identify the trip to riders, "
                                                  "for instance, to identify train numbers for commuter rail trips.")
    direction_id = graphene.Boolean(description="Indicates the direction of travel for a trip.")
    block_id = graphene.String(description="Identifies the block to which the trip belongs.")
    shape_id = graphene.String(description="Identifies a geospatial shape describing the vehicle travel path for a "
                                           "trip.")
    wheelchair_accessible = graphene.Int(description="Indicates wheelchair accessibility.")
    bikes_allowed = graphene.Int(description="Indicates whether bikes are allowed.")
    dir_abbr = graphene.String(description="Direction")


class ArrivalTime(graphene.ObjectType):
    vehicle = graphene.Field(VehiclePosition)
    scheduled_arrival_time = graphene.String(required=True)
    trip = graphene.Field(Trip, required=True)
    updated_arrival_time = graphene.String()


class StopsAndShapes(graphene.ObjectType):
    stops = graphene.List(graphene.NonNull(Stop))
    shapes = graphene.List(graphene.NonNull((graphene.List(graphene.NonNull(Shape)))))


class Query(graphene.ObjectType):
    resolver = Resolver()
    stops_and_shapes = graphene.Field(graphene.NonNull(StopsAndShapes), route_id=graphene.Int(
        required=True), direction_id=graphene.Boolean(required=True), date=graphene.String(required=True),
                                      resolver=resolver.resolve_stops_and_shapes)
    stop = graphene.Field(graphene.NonNull(Stop), stop_id=graphene.String(
        required=True), resolver=resolver.resolve_stop)
    stops_by_name = graphene.Field(graphene.List(graphene.NonNull(Stop)), stop_name=graphene.String(
        required=True), resolver=resolver.resolve_stops_by_name)
    near_by_stops = graphene.Field(graphene.NonNull(graphene.List(graphene.NonNull(Stop))), lat=graphene.Float(
        required=True), lon=graphene.Float(required=True), resolver=resolver.resolve_near_by_stops)

    route = graphene.Field(graphene.NonNull(Route), route_id=graphene.Int(
        required=True), resolver=resolver.resolve_route)
    routes = graphene.Field(graphene.List(graphene.NonNull(Route)), resolver=resolver.resolve_routes)
    trip = graphene.Field(graphene.NonNull(Trip), trip_id=graphene.String(
        required=True), resolver=resolver.resolve_trip)
    distinct_trips = graphene.Field(graphene.List(graphene.NonNull(Trip)), route_id=graphene.Int(required=True),
                                    resolver=resolver.resolve_distinct_trips)
    route_shapes = graphene.Field(graphene.List(graphene.NonNull(Shape)), trip_id=graphene.String(
        required=True), resolver=resolver.resolve_route_shapes)

    vehicle_positions = graphene.Field(graphene.List(graphene.NonNull(VehiclePosition)), route_id=graphene.Int(
        required=True), direction=graphene.Boolean(required=True), resolver=resolver.resolve_vehicle_positions)
    arrival_times = graphene.Field(graphene.List(graphene.NonNull(ArrivalTime)), route_id=graphene.Int(
        required=True), direction=graphene.Boolean(required=True), stop_id=graphene.String(required=True),
                                   date=graphene.String(required=True),
                                   resolver=resolver.resolve_arrival_times)

    # For debugging purposes
    real_time_vehicle_positions = graphene.Field(graphene.List(
        VehiclePosition), resolver=resolver.resolve_vehicle_positions_debug)


schema = graphene.Schema(query=Query)
