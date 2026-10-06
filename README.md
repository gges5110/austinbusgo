# AustinBusLocation

This is a project that aim to provide real-time bus location in Austin, Texas

## Quick Start

### Initial Setup

- Install git hooks: `./setup-hooks.sh` (enables Python linting on commit)
- Complete local setup: `make setup` (installs deps + builds the GTFS database)

### Running the Application

**Terminal 1: Start the backend server**
```bash
make start-be
```

**Terminal 2: Start the frontend**
```bash
make start-fe
```

## Commands

Run `make help` to see all available commands organized by category.

**Setup & Environment:**
- `make setup-env` - Create Python virtual environment
- `make install-deps` - Install Python dependencies
- `make setup` - Complete local setup (deps + GTFS database)

**Development:**
- `make start-be` - Start FastAPI backend (port 5001, hot reload)
- `make start-fe` - Start Vite frontend (port 5173)
- `make update-db` - Download the latest GTFS feed and rebuild the local database
- `make format` - Format Python code with Black

**Frontend:**
- `make build-fe` - Build frontend for production
- `make test-fe` - Run frontend tests
- `make generate` - Export the OpenAPI spec and regenerate typed API hooks (orval)

**Testing:**
- `make test` - Run Python unit tests
- `make test-integration` - Run integration tests
- `make coverage` - Generate test coverage report
- `make coverage-html` - Generate HTML coverage report

**Production:**
- `make start-prod` - Start production server (Gunicorn + UvicornWorker)

## GTFS Data Loading

The backend serves GTFS data from a read-only SQLite file (`etl/gtfs.db`) built by the ETL; `make setup` builds it, and `make update-db` refreshes it.

For detailed information about the ETL pipeline, data sources, and troubleshooting, see [etl/README.md](etl/README.md).
