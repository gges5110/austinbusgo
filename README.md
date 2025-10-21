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
- Download GTFS files from CapMetro: `make downloadGTFS`

## Create PostgreSQL Database

- A docker compose script is provided to set up the database. It relies on GTFS csv files being present
  in `ci-job/capmetro` and ran with `preprocessGTFS.py` script.
