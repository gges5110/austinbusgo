import peewee
from peewee import TextField, IntegerField, FloatField, BooleanField, DateTimeField, DateField, TimeField

from server.database import db_wrapper


# GTFS reference: https://developers.google.com/transit/gtfs/reference


class UnknownField(object):
    def __init__(self, *_, **__):
        pass


class Routes(db_wrapper.Model):
    route_id = TextField(index=True, null=True,
                         primary_key=True, unique=True)
    agency_id = IntegerField(null=True)
    route_short_name = IntegerField(null=True, unique=True)
    route_long_name = TextField(null=True)
    route_desc = TextField(null=True)
    route_type = IntegerField(null=True)
    route_url = TextField(null=True)
    route_color = TextField(null=True)
    route_text_color = TextField(null=True)

    class Meta:
        table_name = 'routes'
        primary_key = False


class Shapes(db_wrapper.Model):
    shape_id = TextField(index=True, null=True)
    shape_pt_lat = FloatField(null=True)
    shape_pt_lon = FloatField(null=True)
    shape_pt_sequence = IntegerField(index=True, null=True)
    shape_dist_traveled = FloatField(null=True)
    sup_detour_flag = TextField(null=True)

    class Meta:
        table_name = 'shapes'
        primary_key = False


class StopTimes(db_wrapper.Model):
    trip_id = TextField(index=True, null=True)
    arrival_time = TextField(null=True)
    departure_time = TextField(null=True)
    stop_id = TextField(index=True, null=True)
    stop_sequence = IntegerField(index=True, null=True)
    stop_headsign = TextField(null=True)
    pickup_type = IntegerField(null=True)
    drop_off_type = IntegerField(null=True)
    shape_dist_traveled = FloatField(null=True)
    timepoint = IntegerField(null=True)
    sup_est_delay = TextField(null=True)

    class Meta:
        table_name = 'stop_times'
        primary_key = False


class Stops(db_wrapper.Model):
    stop_id = TextField(index=True, null=True,
                        primary_key=True, unique=True)
    stop_code = TextField(null=True)
    stop_name = TextField(null=True)
    stop_desc = TextField(null=True)
    stop_lat = FloatField(null=True)
    stop_lon = FloatField(null=True)
    zone_id = TextField(null=True)
    stop_url = TextField(null=True)
    location_type = IntegerField(null=True)
    parent_station = TextField(null=True)
    stop_timezone = TextField(null=True)
    wheelchair_boarding = IntegerField(null=True)
    corner_placement = TextField(null=True)
    stop_position = TextField(null=True)
    on_street = TextField(null=True)
    at_street = TextField(null=True)
    heading = IntegerField(null=True)

    class Meta:
        table_name = 'stops'
        primary_key = False


class Trips(db_wrapper.Model):
    route_id = TextField(index=True, null=True)
    service_id = TextField(null=True)
    trip_id = TextField(index=True, null=True, primary_key=True, unique=True)
    trip_headsign = TextField(null=True)
    trip_short_name = TextField(null=True)
    direction_id = IntegerField(index=True, null=True)
    block_id = TextField(null=True)
    shape_id = TextField(index=True, null=True)
    wheelchair_accessible = IntegerField(null=True)
    bikes_allowed = IntegerField(null=True)
    dir_abbr = TextField(null=True)
    sup_service_mod = IntegerField(null=True)

    class Meta:
        table_name = 'trips'
        primary_key = False


class Calendar(db_wrapper.Model):
    service_id = TextField(index=True, null=True, primary_key=True, unique=True)
    monday = BooleanField(index=True, null=True)
    tuesday = BooleanField(index=True, null=True)
    wednesday = BooleanField(index=True, null=True)
    thursday = BooleanField(index=True, null=True)
    friday = BooleanField(index=True, null=True)
    saturday = BooleanField(index=True, null=True)
    sunday = BooleanField(index=True, null=True)
    start_date = DateField(null=True)
    end_date = DateField(null=True)

    class Meta:
        table_name = 'calendar'
        primary_key = False


class CalendarDates(db_wrapper.Model):
    service_id = TextField(null=True)
    date = DateField(null=True)
    exception_type = IntegerField(null=True)

    class Meta:
        table_name = 'calendar_dates'
        primary_key = False
