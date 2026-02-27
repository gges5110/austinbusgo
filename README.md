# AustinBusLocation

This is a project that aim to provide real-time bus location in Austin, Texas

## Quick Start

### Initial Setup

- Install git hooks: `./setup-hooks.sh` (enables Python linting on commit)
- Complete local setup: `make setup` (starts database + loads GTFS data)

### Running the Application

**Terminal 1: Start the database (if not already running)**
```bash
make start-db
```

**Terminal 2: Start the backend server**
```bash
make start-be
```

**Terminal 3: Start the frontend**
```bash
make start-fe
```

## Commands

Run `make help` to see all available commands organized by category.

**Setup & Environment:**
- `make setup-env` - Create Python virtual environment
- `make install-deps` - Install Python dependencies
- `make setup` - Complete local setup (database + GTFS data)

**Development:**
- `make start-be` - Start FastAPI backend (port 5001, hot reload)
- `make start-fe` - Start Vite frontend (port 5173)
- `make start-db` - Start PostgreSQL database (port 5438)
- `make format` - Format Python code with Black

**Frontend:**
- `make build-fe` - Build frontend for production
- `make test-fe` - Run frontend tests
- `make generate` - Generate GraphQL TypeScript types

**Testing:**
- `make test` - Run Python unit tests
- `make test-integration` - Run integration tests
- `make coverage` - Generate test coverage report
- `make coverage-html` - Generate HTML coverage report

**Production:**
- `make start-prod` - Start production server (Gunicorn + UvicornWorker)

## GTFS Data Loading

The `make setup` command automatically loads GTFS data into PostgreSQL on first setup.

For detailed information about the ETL pipeline, data sources, and troubleshooting, see [etl/README.md](etl/README.md).
