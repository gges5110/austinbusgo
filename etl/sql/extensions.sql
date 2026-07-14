-- Extensions the backend depends on. Run unconditionally on every ETL run
-- (unlike schema.sql, which is skipped when the feed is unchanged) so a
-- newly required extension reaches the database without waiting for
-- CapMetro to publish a new feed.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Query performance monitoring. Requires pg_stat_statements in
-- shared_preload_libraries (set in docker/compose.db.yml locally; enable the
-- equivalent flag on the managed instance in production).
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
