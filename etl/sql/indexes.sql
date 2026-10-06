-- Indexes are created after the bulk load, which is much faster than
-- maintaining them row by row during insertion.

CREATE INDEX TRIPS_route_id_direction_id ON trips(route_id, direction_id);
CREATE INDEX TRIPS_service_id ON trips(service_id);
CREATE INDEX STOP_TIMES_trip_id_stop_sequence ON stop_times(trip_id, stop_sequence);
-- Backs ArrivalTimes: stop_times filtered by stop_id, ordered by arrival time
CREATE INDEX STOP_TIMES_stop_id_arrival_time ON stop_times(stop_id, arrival_time);
CREATE INDEX CALENDAR_DATES_service_id_date ON calendar_dates(service_id, date);
CREATE INDEX CALENDAR_DATES_date ON calendar_dates(date);
CREATE INDEX ROUTES_AT_STOP_route_id ON routes_at_stop(route_id);
-- Backs nearByStops' bounding-box filter
CREATE INDEX STOPS_stop_lat_stop_lon ON stops(stop_lat, stop_lon);
CREATE INDEX TRANSFERS_from_stop_id_to_stop_id ON transfers(from_stop_id, to_stop_id);
