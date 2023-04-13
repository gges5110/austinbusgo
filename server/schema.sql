DROP TABLE stops;
DROP TABLE routes;
DROP TABLE shapes;
DROP TABLE trips;
DROP TABLE stop_times;

CREATE TABLE stops
(
  stop_id           integer UNIQUE NOT NULL PRIMARY KEY,
  stop_code         integer NULL,
  stop_name         text NOT NULL,
  stop_desc         text NULL,
  stop_lat          double precision NOT NULL,
  stop_lon          double precision NOT NULL,
  zone_id           text NULL,
  stop_url          text NULL,
  location_type     boolean NULL,
  parent_station    text NULL,
  stop_timezone     text NULL,
  wheelchair_boarding integer NULL,
  corner_placement  text NULL,
  stop_position     text NULL,
  on_street         text NULL,
  at_street         text NULL,
  heading           integer NULL
);

CREATE TABLE routes
(
  route_id          integer UNIQUE NOT NULL PRIMARY KEY,
  agency_id         integer NULL,
  route_short_name  integer UNIQUE NOT NULL,
  route_long_name   text NULL,
  route_desc        text NULL,
  route_type        integer NULL,
  route_url         text NULL,
  route_color       text NULL,
  route_text_color  text NULL
);

CREATE TABLE shapes
(
  shape_id          text,
  shape_pt_lat      double precision NOT NULL,
  shape_pt_lon      double precision NOT NULL,
  shape_pt_sequence integer NOT NULL,
  shape_dist_traveled double precision NULL,
  sup_detour_flag text NULL
);

CREATE TABLE trips
(
  route_id          integer NOT NULL,
  service_id        text NOT NULL,
  trip_id           text UNIQUE NOT NULL PRIMARY KEY,
  trip_headsign     text NULL,
  trip_short_name   text NULL,
  direction_id      boolean NULL,
  block_id          text NULL,
  shape_id          text NULL,
  wheelchair_accessible integer NULL,
  bikes_allowed     integer NULL,
  dir_abbr          text NULL,
  sup_service_mod   integer NULL
);

CREATE TABLE stop_times
(
  trip_id           text NOT NULL,
  arrival_time      text NOT NULL,
  departure_time    text NOT NULL,
  stop_id           integer NOT NULL,
  stop_sequence     integer NOT NULL,
  stop_headsign     text NULL,
  pickup_type       integer NULL CHECK(pickup_type >= 0 and pickup_type <=3),
  drop_off_type     integer NULL CHECK(drop_off_type >= 0 and drop_off_type <=3),
  shape_dist_traveled double precision NULL,
  timepoint         integer NULL,
  sup_est_delay     integer NULL
);

\copy stops from './capmetro/stops.txt' with csv header
\copy routes from './capmetro/routes.txt' with csv header
\copy shapes from './capmetro/shapes.txt' with csv header
\copy trips from './capmetro/trips.txt' with csv header
\copy stop_times from './capmetro/stop_times.txt' with csv header

CREATE INDEX SHAPES_shape_id ON shapes(shape_id);
CREATE INDEX TRIPS_trip_id_route_id ON trips(trip_id, route_id);
CREATE INDEX TRIPS_trip_id_direction_id ON trips(trip_id, direction_id);
CREATE INDEX STOP_TIMES_trip_id ON stop_times(trip_id);
CREATE INDEX STOP_TIMES_trip_id_stop_id ON stop_times(trip_id, stop_id);
