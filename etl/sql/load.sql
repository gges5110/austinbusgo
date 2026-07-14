\copy agency from './capmetro/agency.txt' with csv header
\copy feed_info from './capmetro/feed_info.txt' with csv header
\copy stops from './capmetro/stops.txt' with csv header
\copy routes from './capmetro/routes.txt' with csv header
\copy shapes from './capmetro/shapes.txt' with csv header
\copy trips from './capmetro/trips.txt' with csv header
\copy stop_times from './capmetro/stop_times.txt' with csv header
\copy calendar_dates from './capmetro/calendar_dates.txt' with csv header
\copy transfers from './capmetro/transfers.txt' with csv header
REFRESH MATERIALIZED VIEW routes_at_stop;

-- Refresh planner statistics after the bulk load so query plans are accurate
-- immediately (instead of waiting for autovacuum), and set the visibility map
-- so the covering indexes can serve index-only scans. Must run outside a
-- transaction block (load_db.py invokes psql without --single-transaction).
VACUUM ANALYZE;
