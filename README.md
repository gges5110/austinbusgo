# AustinBusLocation

This is a project that aim to provide real-time bus location in Austin, Texas

## Quick Start

### Initial Setup

- Install git hooks: `./setup-hooks.sh` (enables Python linting on commit)

### Server + Setup Database

- Setup and start database: `make setup-local`
- Start the server: `make run`

### Client

- Install dependencies: `npm ci`
- Start client: `npm start`

## Commands

**Server & Tests:**
- `make run` - Run dev server (FastAPI on port 5001)
- `make test` - Run backend tests
- `make coverage` - Generate test coverage report
- `make lint` - Format code with Black and Prettier

**Database & ETL:**
- `make db-up` - Start PostgreSQL (detached)
- `make setup-local` - Start PostgreSQL + run GTFS ETL pipeline
- `make etl` - Run full ETL pipeline (download → prepare → load)
- `make etl-download` - Download GTFS data only
- `make etl-prepare` - Preprocess GTFS files only
- `make etl-load` - Load data into database only

## GTFS ETL Pipeline

The ETL pipeline automatically downloads, preprocesses, and loads GTFS data into PostgreSQL.

**Features:**
- Automatic feed version checking (skips reload if feed hasn't changed)
- Preprocesses CSV files (normalizes times, converts coordinates to PostGIS geometry)
- Creates database schema and indexes optimally (indexes after bulk load)
- Generates GitHub Actions job summary (shows feed status, dates, timestamp)

**Quick start:**
```bash
make setup-local    # Start DB + run full ETL pipeline
```

**See [etl/README.md](etl/README.md) for detailed documentation**, including:
- How each step works
- Local development setup
- Troubleshooting
- CI/CD integration
