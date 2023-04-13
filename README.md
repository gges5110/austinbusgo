 [![Storybook](https://cdn.jsdelivr.net/gh/storybookjs/brand@master/badge/badge-storybook.svg)](https://gerrywu.gitlab.io/AustinBusLocation)

# AustinBusLocation
This is a project that aim to provide real-time bus location in Austin, Texas

## Quick Start
### Server + Setup Database
* Install dependencies: `pip install -r requirements.txt`
* Set DATABASE_URL environment variable: `export DATABASE_URL=postgres://[password]@[host]/[database name]`
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
* You can download postgreSQL [here](https://www.postgresql.org/download/)
* To create a database, please refer to this [link](https://www.postgresql.org/docs/12/tutorial-createdb.html)

## Update/Import Database
* The production database is being updated nightly through [scheduled job](./ci-job/updateGTFS.py). 
* The GTFS files can be downloaded from [CapMetro GTFS](https://data.texas.gov/Transportation/CapMetro-GTFS/r4v4-vz24)

## Storybook
* Storybook is a user interface development environment and playground for UI components. For more information please refer to [their documentation](https://storybook.js.org/)
* AustinBusGo's storybook is deployed to [https://gerrywu.gitlab.io/AustinBusLocation/](https://gerrywu.gitlab.io/AustinBusLocation/?path=/story/*)