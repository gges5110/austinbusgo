# GTFS reference: https://developers.google.com/transit/gtfs/reference
from geoalchemy2 import Geometry
from sqlalchemy import Boolean, Column, Date, Float, Integer, Text

from server.database import Base


class FeedInfo(Base):
    __tablename__ = "feed_info"

    feed_publisher_name = Column(Text, primary_key=True)
    feed_publisher_url = Column(Text)
    feed_lang = Column(Text)
    feed_start_date = Column(Date, nullable=True)
    feed_end_date = Column(Date, nullable=True)
    feed_version = Column(Text)


class Routes(Base):
    __tablename__ = "routes"

    route_id = Column(Text, primary_key=True)
    agency_id = Column(Text, nullable=True)
    route_short_name = Column(Text, nullable=True)
    route_long_name = Column(Text, nullable=True)
    route_type = Column(Integer, nullable=True)
    route_url = Column(Text, nullable=True)
    route_color = Column(Text, nullable=True)
    route_text_color = Column(Text, nullable=True)


class Shapes(Base):
    __tablename__ = "shapes"

    shape_id = Column(Text, primary_key=True)
    shape_pt_sequence = Column(Integer, primary_key=True)
    shape_pt_loc = Column(Geometry("POINT", srid=4326), nullable=True)
    shape_dist_traveled = Column(Float, nullable=True)


class AggregatedShape(Base):
    __tablename__ = "shapes_aggregated"

    shape_id = Column(Text, primary_key=True)
    shape = Column(Geometry("LINESTRING", srid=4326), nullable=True)


class StopTimes(Base):
    __tablename__ = "stop_times"

    trip_id = Column(Text, primary_key=True)
    stop_sequence = Column(Integer, primary_key=True)
    arrival_time = Column(Text, nullable=True)
    departure_time = Column(Text, nullable=True)
    stop_id = Column(Text, nullable=True)
    pickup_type = Column(Integer, nullable=True)
    drop_off_type = Column(Integer, nullable=True)
    shape_dist_traveled = Column(Float, nullable=True)
    timepoint = Column(Integer, nullable=True)


class RoutesAtStop(Base):
    __tablename__ = "routes_at_stop"

    stop_id = Column(Text, primary_key=True)
    route_id = Column(Text, primary_key=True)


class Stops(Base):
    __tablename__ = "stops"

    stop_id = Column(Text, primary_key=True)
    stop_code = Column(Text, nullable=True)
    stop_name = Column(Text, nullable=True)
    stop_desc = Column(Text, nullable=True)
    stop_loc = Column(Geometry("POINT", srid=4326), nullable=True)
    zone_id = Column(Text, nullable=True)
    stop_url = Column(Text, nullable=True)
    location_type = Column(Integer, nullable=True)
    parent_station = Column(Text, nullable=True)
    stop_timezone = Column(Text, nullable=True)
    wheelchair_boarding = Column(Integer, nullable=True)
    corner_placement = Column(Text, nullable=True)
    stop_position = Column(Text, nullable=True)
    on_street = Column(Text, nullable=True)
    at_street = Column(Text, nullable=True)
    heading = Column(Integer, nullable=True)


class Trips(Base):
    __tablename__ = "trips"

    trip_id = Column(Text, primary_key=True)
    route_id = Column(Text, nullable=True)
    service_id = Column(Text, nullable=True)
    trip_headsign = Column(Text, nullable=True)
    direction_id = Column(Integer, nullable=True)
    block_id = Column(Text, nullable=True)
    shape_id = Column(Text, nullable=True)
    scheduled_trip_id = Column(Text, nullable=True)
    trip_short_name = Column(Text, nullable=True)
    wheelchair_accessible = Column(Integer, nullable=True)
    bikes_allowed = Column(Integer, nullable=True)


class Calendar(Base):
    __tablename__ = "calendar"

    service_id = Column(Text, primary_key=True)
    monday = Column(Boolean, nullable=True)
    tuesday = Column(Boolean, nullable=True)
    wednesday = Column(Boolean, nullable=True)
    thursday = Column(Boolean, nullable=True)
    friday = Column(Boolean, nullable=True)
    saturday = Column(Boolean, nullable=True)
    sunday = Column(Boolean, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)


class CalendarDates(Base):
    __tablename__ = "calendar_dates"

    service_id = Column(Text, primary_key=True)
    date = Column(Date, primary_key=True)
    exception_type = Column(Integer, nullable=True)
