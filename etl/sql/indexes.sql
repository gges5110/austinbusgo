-- Indexes are created after bulk data load for significantly faster COPY performance.
-- PostgreSQL builds these indexes in bulk, which is much faster than maintaining
-- them incrementally during row-by-row insertion.
--
-- Everything here must stay idempotent (IF NOT EXISTS): the ETL also runs
-- this file when the feed is unchanged and the reload is skipped, so newly
-- added indexes reach the database without waiting for a new feed.

CREATE INDEX IF NOT EXISTS SHAPES_shape_id ON shapes(shape_id);

-- trips.trip_id and stops.stop_id are PRIMARY KEYs, so their implicit unique
-- indexes already serve trip_id / stop_id lookups. These older composites were
-- redundant: TRIPS_trip_id_* duplicate the trip_id PK (unique -> one row, so the
-- trailing column adds nothing), and STOP_TIMES_trip_id is a strict prefix of
-- STOP_TIMES_trip_id_stop_id. Dropped here (idempotent no-ops once gone).
DROP INDEX IF EXISTS TRIPS_trip_id_route_id;
DROP INDEX IF EXISTS TRIPS_trip_id_direction_id;
DROP INDEX IF EXISTS STOP_TIMES_trip_id;

-- The route/direction filters (get_stops_by_route_id, get_trips_by_distinct_
-- short_name, get_trips_with_direction_and_route) had no supporting index and
-- fell back to scanning trips. This index covers them directly.
CREATE INDEX IF NOT EXISTS TRIPS_route_id_direction_id ON trips(route_id, direction_id);

CREATE INDEX IF NOT EXISTS STOP_TIMES_trip_id_stop_id ON stop_times(trip_id, stop_id);
CREATE INDEX IF NOT EXISTS ROUTES_AT_STOP_stop_id_route_id ON routes_at_stop(stop_id, route_id);
CREATE INDEX IF NOT EXISTS TRANSFERS_from_stop_id_to_stop_id ON transfers(from_stop_id, to_stop_id);

-- Trigram indexes backing the fuzzy search queries
CREATE INDEX IF NOT EXISTS STOPS_stop_name_trgm ON stops USING gin (stop_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS STOPS_on_street_trgm ON stops USING gin (on_street gin_trgm_ops);
CREATE INDEX IF NOT EXISTS STOPS_at_street_trgm ON stops USING gin (at_street gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ROUTES_route_long_name_trgm ON routes USING gin (route_long_name gin_trgm_ops);

-- Spatial index backing nearByStops' ST_Intersects/ST_Distance
CREATE INDEX IF NOT EXISTS STOPS_stop_loc_gist ON stops USING gist (stop_loc);

-- Backs ArrivalTimes: stop_times filtered by (stop_id, arrival_time). The
-- INCLUDE columns are the remaining stop_times columns that query reads
-- (get_stop_times_by_stop_id), making it an index-only scan — the covering
-- index plus the VACUUM ANALYZE in load.sql (which sets the visibility map)
-- lets Postgres skip the heap entirely. Supersedes the old non-covering index.
DROP INDEX IF EXISTS STOP_TIMES_stop_id_arrival_time;
CREATE INDEX IF NOT EXISTS STOP_TIMES_stop_id_arrival_time_covering
  ON stop_times(stop_id, arrival_time)
  INCLUDE (trip_id, departure_time, stop_sequence);
