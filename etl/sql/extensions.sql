-- Extensions the backend depends on. Run unconditionally on every ETL run
-- (unlike schema.sql, which is skipped when the feed is unchanged) so a
-- newly required extension reaches the database without waiting for
-- CapMetro to publish a new feed.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
