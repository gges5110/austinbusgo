-- Indexes are created after bulk data load for significantly faster COPY performance.
-- PostgreSQL builds these indexes in bulk, which is much faster than maintaining
-- them incrementally during row-by-row insertion.

CREATE INDEX SHAPES_shape_id ON shapes(shape_id);
CREATE INDEX TRIPS_trip_id_route_id ON trips(trip_id, route_id);
CREATE INDEX TRIPS_trip_id_direction_id ON trips(trip_id, direction_id);
CREATE INDEX STOP_TIMES_trip_id ON stop_times(trip_id);
CREATE INDEX STOP_TIMES_trip_id_stop_id ON stop_times(trip_id, stop_id);
CREATE INDEX ROUTES_AT_STOP_stop_id_route_id ON routes_at_stop(stop_id, route_id);
CREATE INDEX TRANSFERS_from_stop_id_to_stop_id ON transfers(from_stop_id, to_stop_id);

-- Trigram indexes backing the fuzzy search queries
CREATE INDEX STOPS_stop_name_trgm ON stops USING gin (stop_name gin_trgm_ops);
CREATE INDEX STOPS_on_street_trgm ON stops USING gin (on_street gin_trgm_ops);
CREATE INDEX STOPS_at_street_trgm ON stops USING gin (at_street gin_trgm_ops);
CREATE INDEX ROUTES_route_long_name_trgm ON routes USING gin (route_long_name gin_trgm_ops);
