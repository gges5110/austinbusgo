DROP TABLE IF EXISTS stops;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS shapes;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS stop_times;
DROP TABLE IF EXISTS calendar;
DROP TABLE IF EXISTS calendar_dates;

CREATE TABLE stops
(
  stop_id           text UNIQUE NOT NULL PRIMARY KEY,
  stop_code         text NULL,
  stop_name         text NOT NULL,
  stop_desc         text NULL,
  stop_loc          geography(POINT) NOT NULL, -- stop_lat/stop_lon
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
  route_id          text UNIQUE NOT NULL PRIMARY KEY,
  agency_id         integer NULL,
  route_short_name  text UNIQUE NOT NULL,
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
  shape_pt_loc       geography(POINT) NOT NULL, -- shape_pt_lat/shape_pt_lon
  shape_pt_sequence integer NOT NULL,
  shape_dist_traveled double precision NULL,
  sup_detour_flag text NULL
);

CREATE OR REPLACE VIEW shapes_aggregated AS
SELECT
	shape_id,
	ST_MakeLine(array_agg(shape_pt_loc)) AS shape
FROM (
	SELECT
		shape_id,
		ST_AsText(shape_pt_loc)::geometry AS shape_pt_loc
	FROM shapes
	ORDER by shape_id, shape_pt_sequence
) shapes
GROUP BY shape_id;

CREATE TABLE trips
(
  route_id          text NOT NULL,
  service_id        text NOT NULL,
  trip_id           text UNIQUE NOT NULL PRIMARY KEY,
  trip_headsign     text NULL,
  trip_short_name   text NULL,
  direction_id      integer NULL,
  block_id          text NULL,
  shape_id          text NULL,
  wheelchair_accessible integer NULL,
  bikes_allowed     integer NULL,
  dir_abbr          text NULL, -- capital metro specific column
  sup_service_mod   integer NULL
);

CREATE TABLE stop_times
(
  trip_id           text NOT NULL,
  arrival_time      text NOT NULL, -- not using TIME field because it might contain values like '24:59:30'
  departure_time    text NOT NULL, -- not using TIME field because it might contain values like '24:59:30'
  stop_id           text NOT NULL,
  stop_sequence     integer NOT NULL,
  stop_headsign     text NULL,
  pickup_type       integer NULL CHECK(pickup_type >= 0 and pickup_type <=3),
  drop_off_type     integer NULL CHECK(drop_off_type >= 0 and drop_off_type <=3),
  shape_dist_traveled double precision NULL,
  timepoint         integer NULL,
  sup_est_delay     integer NULL
);

CREATE TABLE calendar
(
  service_id        text PRIMARY KEY,
  monday            boolean NOT NULL,
  tuesday           boolean NOT NULL,
  wednesday         boolean NOT NULL,
  thursday          boolean NOT NULL,
  friday            boolean NOT NULL,
  saturday          boolean NOT NULL,
  sunday            boolean NOT NULL,
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  service_name      text NOT NULL
);

CREATE TABLE calendar_dates
(
  service_id        text NOT NULL,
  date              DATE NOT NULL,
  exception_type    integer NOT NULL
);

\copy stops from './capmetro/stops.txt' with csv header
\copy routes from './capmetro/routes.txt' with csv header
\copy shapes from './capmetro/shapes.txt' with csv header
\copy trips from './capmetro/trips.txt' with csv header
\copy stop_times from './capmetro/stop_times.txt' with csv header
\copy calendar from './capmetro/calendar.txt' with csv header
\copy calendar_dates from './capmetro/calendar_dates.txt' with csv header

CREATE INDEX SHAPES_shape_id ON shapes(shape_id);
CREATE INDEX TRIPS_trip_id_route_id ON trips(trip_id, route_id);
CREATE INDEX TRIPS_trip_id_direction_id ON trips(trip_id, direction_id);
CREATE INDEX STOP_TIMES_trip_id ON stop_times(trip_id);
CREATE INDEX STOP_TIMES_trip_id_stop_id ON stop_times(trip_id, stop_id);
CREATE INDEX CALENDAR_service_id ON calendar(service_id);