-- Tables derived from the loaded GTFS data. Run after the base tables are
-- populated (by build_db.py, and by the integration-test fixtures).

INSERT INTO routes_at_stop (route_id, stop_id)
SELECT DISTINCT trips.route_id, stop_times.stop_id
FROM stop_times
JOIN trips ON trips.trip_id = stop_times.trip_id;
