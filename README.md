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

- Run dev server: `make run`
- Run tests: `make test`
- Generate test coverage report: `make coverage`
- Lint: `make lint`
- Download GTFS files from CapMetro: `make etl-download`

## Create PostgreSQL Database

- A Docker Compose setup is provided to start the database and run the GTFS ETL job.
  - `make db-up` — start PostgreSQL only (detached)
  - `make setup-local` — start PostgreSQL and run the GTFS prep job
  - GTFS CSV files are sourced from `etl/capmetro/` and processed by `etl/prepare.py`
