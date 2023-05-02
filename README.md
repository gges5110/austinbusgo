[![Storybook](https://cdn.jsdelivr.net/gh/storybookjs/brand@master/badge/badge-storybook.svg)](https://gerrywu.gitlab.io/AustinBusLocation)

# AustinBusLocation

This is a project that aim to provide real-time bus location in Austin, Texas

## Quick Start

### Server + Setup Database

* Start up database: `make setup-local`
* Install dependencies: `make install`
* Start the server: `make run`

### Client

Please refer to README.md in `client/`

## Commands

* Run dev server: `make run`
* Run tests: `make test`
* Generate test coverage report: `make coverage`
* Lint: `make lint`
* Download GTFS files from CapMetro: `make downloadGTFS`

## Create postgreSQL Database

* A docker compose script is provided to setup the database. It relies on GTFS csv files being present
  in  `ci-job/capmetro` and ran with `preprocessGTFS.py` script.

## Update/Import Database

* The production database is being updated nightly through [scheduled job](./ci-job/updateGTFS.py).
* The GTFS files can be downloaded from [CapMetro GTFS](https://data.texas.gov/Transportation/CapMetro-GTFS/r4v4-vz24)
