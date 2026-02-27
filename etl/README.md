# GTFS ETL Pipeline

This directory contains the Extract, Transform, Load (ETL) pipeline for GTFS (General Transit Feed Specification) data from CapMetro.

## Overview

The ETL pipeline downloads GTFS data from the Texas data portal, preprocesses it, and loads it into a PostgreSQL database. The pipeline includes automatic feed version checking to avoid unnecessary reloads.

## Structure

```
etl/
├── main.py              # Entry point - orchestrates the entire pipeline
├── download.py          # Downloads GTFS data from Texas data portal
├── prepare.py           # Preprocesses CSV files (normalizes times, converts coordinates)
├── load_db.py           # Loads data into PostgreSQL + generates summary
├── sql/                 # SQL scripts
│   ├── schema.sql       # Database schema with PostGIS extension
│   ├── load.sql         # COPY commands to load CSV data
│   ├── indexes.sql      # Index creation (performed after bulk load for speed)
│   └── teardown.sql     # Drop existing tables
├── docker/              # Docker-specific scripts
│   └── install-curl.sh  # Alpine Linux curl installation
├── capmetro/            # Downloaded and processed GTFS CSV files
└── tests/               # Unit tests
```

## Running the Pipeline

### Full Pipeline

Run the complete ETL process (download → prepare → load):

```bash
# With environment variable
DATABASE_URL="postgresql://user:pass@localhost:5432/db" python main.py

# Or via Makefile (uses local dev database)
make etl
```

### Individual Steps

Download GTFS data:
```bash
python download.py
```

Preprocess CSV files:
```bash
python prepare.py
```

Load data into database:
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/db" python load_db.py
```

## How It Works

### 1. Download (`download.py`)
- Downloads GTFS feed from Texas data portal
- Extracts ZIP file to `capmetro/` directory
- Preserves existing files (useful if download fails)

### 2. Prepare (`prepare.py`)
- Normalizes stop times (adds leading zeros for times like `09:05:00`)
- Converts stop coordinates from separate `stop_lat`/`stop_lon` to PostGIS `POINT` geometry
- Converts shape coordinates from `shape_pt_lat`/`shape_pt_lon` to `POINT` geometry
- Validates feed dates from `feed_info.txt`

### 3. Load (`load_db.py`)
**Feed Version Check:**
- Compares `feed_start_date` from new GTFS data with database
- If unchanged, skips expensive reload (prints message and generates summary)
- If changed, proceeds with database reload

**Database Operations:**
1. Drop old schema (`teardown.sql`)
2. Create new schema (`schema.sql`)
3. Bulk load CSV data (`load.sql`)
4. Create indexes (`indexes.sql`)

**Why indexes last?** Building indexes on already-populated tables is faster than maintaining them during incremental inserts, especially for the large `stop_times` table.

**Job Summary:**
- Generates a summary of the operation (feed status, dates, timestamp)
- Writes to `$GITHUB_STEP_SUMMARY` for GitHub Actions display
- Falls back to stdout if not in GitHub Actions

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
  - Format: `postgresql://user:password@host:port/database`
  - Example: `postgresql://local-user:local-password@localhost:5438/local-db`

## Local Development

### Setup

```bash
# Start PostgreSQL
make db-up

# Run full pipeline (downloads GTFS, prepares, loads)
make etl
```

### Database Connection

Default local credentials:
- Host: `localhost`
- Port: `5438` (non-standard to avoid conflicts)
- User: `local-user`
- Password: `local-password`
- Database: `local-db`

Connection string:
```
postgresql://local-user:local-password@localhost:5438/local-db
```

## CI/CD Integration

The pipeline is automatically run on a daily schedule (midnight UTC) via GitHub Actions.

**Workflow file:** `.github/workflows/updateGTFS.yml`

**Trigger:**
- Daily at 00:00 UTC (cron: `0 0 * * *`)
- Manual trigger via `workflow_dispatch`

**Steps:**
1. Authenticate to Google Cloud
2. Set up Cloud SQL Auth Proxy
3. Install Python and PostgreSQL client
4. Run `python main.py`
5. Job summary is automatically captured and displayed

## Dependencies

**Python:**
- `csv` - CSV file parsing (stdlib)
- `zipfile` - ZIP extraction (stdlib)
- `subprocess` - System command execution (stdlib)
- `pathlib` - Path manipulation (stdlib)

**System:**
- `curl` - Download files
- `psql` - PostgreSQL client
- `unzip` - Extract ZIP archives

## Data Source

- **Source:** [Texas Open Data Portal - CapMetro GTFS](https://data.texas.gov/dataset/CapMetro-GTFS-Data-Feed/r4v4-vz24)
- **Format:** General Transit Feed Specification (GTFS)
- **Contents:**
  - Routes, stops, trips, stop times (schedule data)
  - Service calendars and exceptions
  - Shapes (route geometry)
  - Agency and transfer information

## Troubleshooting

### "Feed start date unchanged" - Database wasn't reloaded
This is expected if the GTFS feed hasn't been updated. The pipeline skips reloads to save time. You can force a reload by manually running `load_db.py`.

### Database connection errors
- Check `DATABASE_URL` is correctly set
- Ensure PostgreSQL is running on the specified host/port
- Verify credentials are correct
- For Docker: ensure `make db-up` has been run

### CSV parsing errors
These usually indicate the GTFS feed format has changed. Check `prepare.py` preprocessing logic matches the current feed structure.

## References

- [GTFS Specification](https://developers.google.com/transit/gtfs/reference)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [SQLAlchemy GTFS Models](../server/models/)