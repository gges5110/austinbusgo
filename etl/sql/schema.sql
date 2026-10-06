-- SQLite schema for the read-only GTFS database baked into the backend image.
--
-- Geometries are stored pre-serialized as GeoJSON text so the backend can
-- return them as-is (no spatial extension needed). Stops also keep plain
-- stop_lat/stop_lon columns for bounding-box filtering.
--
-- Dates are ISO-8601 text ('YYYY-MM-DD'), which is what SQLAlchemy's Date
-- type reads and writes on SQLite.

CREATE TABLE agency
(
  agency_id         text UNIQUE NULL,
  agency_name       text NOT NULL,
  agency_url        text NOT NULL,
  agency_timezone   text NOT NULL,
  agency_lang       text NULL,
  agency_phone      text NULL
);

CREATE TABLE feed_info (
  feed_publisher_name   text NOT NULL,
  feed_publisher_url    text NOT NULL,
  feed_lang             text NOT NULL,
  feed_start_date       text NULL,
  feed_end_date         text NULL,
  feed_version          text NULL,
  feed_contact_url      text NULL
);

CREATE TABLE stops
(
  stop_id           text NOT NULL PRIMARY KEY,
  at_street         text NULL,
  corner_placement  text NULL,
  heading           integer NULL,
  location_type     integer NULL,
  on_street         text NULL,
  parent_station    text NULL,
  stop_code         text NULL,
  stop_desc         text NULL,
  stop_lat          real NOT NULL,
  stop_lon          real NOT NULL,
  -- GeoJSON Point
  stop_loc          text NOT NULL,
  stop_name         text NOT NULL,
  stop_position     text NULL,
  stop_timezone     text NULL,
  stop_url          text NULL,
  wheelchair_boarding integer NULL,
  zone_id           text NULL
);

CREATE TABLE routes
(
  route_id          text NOT NULL PRIMARY KEY,
  agency_id         text NULL,
  route_short_name  text UNIQUE NOT NULL,
  route_long_name   text NULL,
  route_type        integer NULL,
  route_url         text NULL,
  route_color       text NULL,
  route_text_color  text NULL
);

-- One row per shape: the ordered shape points as a GeoJSON LineString.
-- Built from shapes.txt by the loader; the raw per-point rows are not kept.
CREATE TABLE shapes_aggregated
(
  shape_id          text NOT NULL PRIMARY KEY,
  shape             text NOT NULL
);

CREATE TABLE trips
(
  route_id          text NOT NULL REFERENCES routes(route_id),
  service_id        text NOT NULL,
  trip_id           text NOT NULL PRIMARY KEY,
  trip_headsign     text NULL,
  direction_id      integer NULL,
  block_id          text NULL,
  shape_id          text NULL,
  scheduled_trip_id text NULL,
  trip_short_name   text NULL,
  wheelchair_accessible integer NULL,
  bikes_allowed     integer NULL
);

CREATE TABLE stop_times
(
  trip_id           text NOT NULL REFERENCES trips(trip_id),
  arrival_time      text NOT NULL,
  departure_time    text NOT NULL,
  stop_id           text NOT NULL REFERENCES stops(stop_id),
  stop_sequence     integer NOT NULL,
  pickup_type       integer NULL CHECK(pickup_type >= 0 and pickup_type <=3),
  drop_off_type     integer NULL CHECK(drop_off_type >= 0 and drop_off_type <=3),
  shape_dist_traveled real NULL,
  timepoint         integer NULL
);

CREATE TABLE calendar_dates
(
  service_id        text NOT NULL,
  date              text NOT NULL,
  exception_type    integer NOT NULL
);

CREATE TABLE transfers
(
    from_stop_id        text NOT NULL,
    to_stop_id          text NOT NULL,
    transfer_type       integer NULL,
    min_transfer_time   integer
);

-- Filled by derived.sql after the base tables are loaded
CREATE TABLE routes_at_stop
(
  route_id          text NOT NULL,
  stop_id           text NOT NULL,
  PRIMARY KEY (stop_id, route_id)
);
