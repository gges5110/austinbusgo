# ETL Pipeline

This document describes the ETL (Extract, Transform, Load) pipeline that populates the Austin Bus Go database with GTFS static data from CapMetro.

## Overview

The `etl/` directory owns the full database lifecycle — schema creation, teardown, and data loading. The server is a read-only consumer of the database and has no schema responsibility.

The pipeline runs as a nightly GitHub Actions job and can also be triggered manually or run locally.

## Pipeline Stages

### 1. Extract — `download.sh`

Downloads the GTFS static feed from the CapMetro dataset hosted on the Texas Open Data Portal and unzips it into `etl/capmetro/`.

```
etl/capmetro/
├── agency.txt
├── calendar_dates.txt
├── feed_info.txt
├── routes.txt
├── shapes.txt
├── stop_times.txt
├── stops.txt
├── transfers.txt
└── trips.txt
```

### 2. Transform — `prepare.py`

Preprocesses the raw GTFS files before loading into PostgreSQL:

- **`stop_times.txt`** — Normalizes `arrival_time` and `departure_time` to 8-character format (e.g. `8:00:00` → `08:00:00`) since PostgreSQL rejects the short form.
- **`stops.txt`** — If the feed provides `stop_lat`/`stop_lon` columns, converts them into a PostGIS `POINT` geometry in the `stop_loc` column. If the feed already provides `stop_loc`, no transformation is applied.
- **`shapes.txt`** — Same as stops: converts `shape_pt_lat`/`shape_pt_lon` into `shape_pt_loc` if needed.

> **Note:** CapMetro's feed format has changed over time. The preprocessing functions are written defensively to handle both old (lat/lon columns) and new (geometry column) formats.

### 3. Load — `load.sh`

Runs three SQL files against the database in sequence:

| File | Purpose |
|------|---------|
| `teardown.sql` | Drops all existing tables, views, and materialized views |
| `schema.sql` | Recreates the schema — tables, views, indexes, PostGIS extension |
| `load.sql` | Bulk loads the preprocessed CSV files via `\copy` |

The load is a full replace — each run tears down and rebuilds the entire dataset.

## SQL Files

### `teardown.sql`

Drops all objects in dependency order so foreign key constraints don't block the drops.

### `schema.sql`

Defines:
- Tables: `agency`, `feed_info`, `stops`, `routes`, `shapes`, `trips`, `stop_times`, `calendar_dates`, `transfers`
- Views: `shapes_aggregated` (aggregates shape points into linestrings)
- Materialized view: `routes_at_stop` (precomputes which routes serve each stop)
- Indexes on high-traffic foreign key and join columns

### `load.sql`

Bulk loads each table from the preprocessed CSV files using PostgreSQL's `\copy` command. The paths are relative to the `etl/` directory, which `load.sh` ensures by `cd`-ing there before invoking `psql`.

## Running Locally

Requires PostgreSQL client (`psql`) and the database to be running.

```bash
# Full pipeline (download + prepare + load)
make etl

# Individual stages
make etl-download
make etl-prepare
make etl-load
```

`make etl-load` uses the local database URL:
```
postgresql://local-user:local-password@localhost:5438/local-db
```

Start the local database first if it isn't running:
```bash
make setup-local
```

## GitHub Actions

The pipeline runs automatically every night at midnight UTC via `.github/workflows/updateGTFS.yml`, and can be triggered manually via `workflow_dispatch`.

The `DATABASE_URL` for the production Cloud SQL instance is stored as the `DBURI` repository secret.

## Architecture Decision

The ETL pipeline owns the database schema rather than the server. This means:

- Schema changes are made in `etl/schema.sql`, not in the server's ORM models
- The server's Peewee models mirror the schema but do not define it
- A full data refresh (teardown + reload) is the update strategy — there is no incremental migration

This fits the nature of GTFS static data, which is replaced wholesale on each feed update rather than patched incrementally.
