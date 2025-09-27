CREATE EXTENSION IF NOT EXISTS postgis;

DROP MATERIALIZED VIEW IF EXISTS routes_at_stop CASCADE;
DROP VIEW IF EXISTS shapes_aggregated CASCADE;
DROP TABLE IF EXISTS stop_times CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS shapes CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS stops CASCADE;
DROP TABLE IF EXISTS calendar_dates CASCADE;
DROP TABLE IF EXISTS calendar CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS feed_info CASCADE;
DROP TABLE IF EXISTS agency CASCADE;

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
  feed_start_date       DATE NULL,
  feed_end_date         DATE NULL,
  feed_version          text NULL,
  feed_contact_url      text NULL
);

CREATE TABLE stops
(
  stop_id           text UNIQUE NOT NULL PRIMARY KEY,
  at_street         text NULL,
  corner_placement  text NULL,
  heading           integer NULL,
  location_type     integer NULL,
  on_street         text NULL,
  parent_station    text NULL,
  stop_code         text NULL,
  stop_desc         text NULL,
  stop_loc          geography(POINT) NOT NULL,
  stop_name         text NOT NULL,
  stop_position     text NULL,
  stop_timezone     text NULL,
  stop_url          text NULL,
  wheelchair_boarding integer NULL,
  zone_id           text NULL
);

CREATE TABLE routes
(
  route_id          text UNIQUE NOT NULL PRIMARY KEY,
  agency_id         text NULL,
  route_short_name  text UNIQUE NOT NULL,
  route_long_name   text NULL,
  route_type        integer NULL,
  route_url         text NULL,
  route_color       text NULL,
  route_text_color  text NULL
);

CREATE TABLE shapes
(
  shape_id          text,
  shape_pt_loc       geography(POINT) NOT NULL,
  shape_pt_sequence integer NOT NULL,
  shape_dist_traveled double precision NULL
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
  direction_id      integer NULL,
  block_id          text NULL,
  shape_id          text NULL,
  scheduled_trip_id text NULL,
  trip_short_name   text NULL,
  wheelchair_accessible integer NULL,
  bikes_allowed     integer NULL,
  CONSTRAINT fk_route
	FOREIGN KEY(route_id)
      REFERENCES routes(route_id)
);

CREATE TABLE stop_times
(
  trip_id           text NOT NULL,
  arrival_time      text NOT NULL,
  departure_time    text NOT NULL,
  stop_id           text NOT NULL,
  stop_sequence     integer NOT NULL,
  pickup_type       integer NULL CHECK(pickup_type >= 0 and pickup_type <=3),
  drop_off_type     integer NULL CHECK(drop_off_type >= 0 and drop_off_type <=3),
  shape_dist_traveled double precision NULL,
  timepoint         integer NULL,
  CONSTRAINT fk_stop
	FOREIGN KEY(stop_id)
      REFERENCES stops(stop_id),
  CONSTRAINT fk_trip
	FOREIGN KEY(trip_id)
      REFERENCES trips(trip_id)
);

CREATE TABLE calendar_dates
(
  service_id        text NOT NULL,
  date              DATE NOT NULL,
  exception_type    integer NOT NULL
);

CREATE TABLE transfers
(
    from_stop_id        text NOT NULL,
    to_stop_id          text NOT NULL,
    transfer_type       integer NOT NULL,
    min_transfer_time   integer
);

\copy agency from './capmetro/agency.txt' with csv header
\copy feed_info from './capmetro/feed_info.txt' with csv header
\copy stops from './capmetro/stops.txt' with csv header
\copy routes from './capmetro/routes.txt' with csv header
\copy shapes from './capmetro/shapes.txt' with csv header
\copy trips from './capmetro/trips.txt' with csv header
\copy stop_times from './capmetro/stop_times.txt' with csv header
\copy calendar_dates from './capmetro/calendar_dates.txt' with csv header
\copy transfers from './capmetro/transfers.txt' with csv header

CREATE MATERIALIZED VIEW routes_at_stop AS
SELECT routes.route_id, stop_times.stop_id
FROM stop_times
JOIN trips ON trips.trip_id = stop_times.trip_id
JOIN routes ON routes.route_id = trips.route_id
GROUP BY routes.route_id, stop_times.stop_id;

CREATE INDEX SHAPES_shape_id ON shapes(shape_id);
CREATE INDEX TRIPS_trip_id_route_id ON trips(trip_id, route_id);
CREATE INDEX TRIPS_trip_id_direction_id ON trips(trip_id, direction_id);
CREATE INDEX STOP_TIMES_trip_id ON stop_times(trip_id);
CREATE INDEX STOP_TIMES_trip_id_stop_id ON stop_times(trip_id, stop_id);
CREATE INDEX ROUTES_AT_STOP_stop_id_route_id ON routes_at_stop(stop_id, route_id);
CREATE INDEX TRANSFERS_from_stop_id_to_stop_id ON transfers(from_stop_id, to_stop_id);