# ETL Pipeline

This document describes the ETL (Extract, Transform, Load) pipeline that builds the Austin Bus Go GTFS database from CapMetro's static feed.

## Overview

The `etl/` directory owns the database: schema, derived tables, indexes, and data loading. Its output is a single read-only **SQLite file** (`etl/gtfs.db`) that is baked into the backend's Docker image. The server opens it read-only and has no schema responsibility.

There is no database server. A new feed (or a schema change) ships by rebuilding the file and redeploying the backend image.

## Pipeline Stages

`etl/main.py` runs all three stages: `python etl/main.py [output.db]` (default `etl/gtfs.db`).

### 1. Extract: `download.py`

Downloads the GTFS static feed from the CapMetro dataset hosted on the Texas Open Data Portal and unzips it into `etl/capmetro/`.

### 2. Transform: `prepare.py`

Normalizes the raw GTFS files in place:

- **`stop_times.txt`**: pads `arrival_time` and `departure_time` to 8 characters (`8:00:00` → `08:00:00`) so they sort and compare correctly as text.
- **`stops.txt`** / **`shapes.txt`**: rewrites `*_lat`/`*_lon` columns into a WKT `POINT(lon lat)` `*_loc` column. The loader accepts either form.

### 3. Load: `build_db.py`

Builds a fresh SQLite database:

1. Creates the tables from `sql/schema.sql`.
2. Loads every GTFS file. Empty CSV fields load as NULL, GTFS `YYYYMMDD` dates are stored as ISO `YYYY-MM-DD`, and stop locations are stored both as `stop_lat`/`stop_lon` (for bounding-box queries) and as GeoJSON text (`stop_loc`).
3. Aggregates `shapes.txt` into one GeoJSON LineString per shape (`shapes_aggregated`). The per-point rows are not kept.
4. Fills derived tables from `sql/derived.sql` (`routes_at_stop`).
5. Creates the indexes in `sql/indexes.sql` after the bulk load, then runs `ANALYZE` and `VACUUM`.

The build writes to `<output>.tmp` and atomically renames it when complete, so a failed run never leaves a half-built database behind. A full build of the current feed takes a few seconds and produces about 180 MB.

## Running Locally

```bash
make update-db     # download + prepare + build etl/gtfs.db
make start-be      # serves etl/gtfs.db (builds it first if missing)
```

The ETL is pure-stdlib Python; no database server or Docker is needed.

## GitHub Actions

`.github/workflows/deployBackend.yml` runs the ETL, builds the backend image with the database inside, and deploys it to Cloud Run. It runs:

- on every push to `main` (via `main.yml`), so ETL and schema changes ship with the code that depends on them;
- nightly (via `updateGTFS.yml`), redeploying only when the built feed's `feed_version` differs from what the live backend reports at `/api/feed-info`.

When the feed changed, the workflow also rotates the edge cache's `CACHE_VERSION` and re-warms it.

## Architecture Decision

The GTFS static data is read-only between feed updates and small (about 1M rows), so it ships as a file inside the image instead of living in a managed database:

- No database to pay for or operate; Cloud Run stays within its free tier behind the edge cache.
- Schema changes are made in `etl/sql/`; the server's SQLAlchemy models mirror the schema but do not define it.
- A full rebuild is the only update strategy; there are no migrations.
- Postgres extensions were replaced with plain code: fuzzy search uses a Python port of pg_trgm's `word_similarity` registered as a SQLite function (`server/services/text_similarity.py`), and nearby-stops uses a lat/lon bounding box plus haversine distance.
