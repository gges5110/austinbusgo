export PYTHONPATH := ./server

# Variables
VENV           = venv
VENV_PYTHON    = $(VENV)/bin/python
SYSTEM_PYTHON  = $(or $(shell which python3), $(shell which python))
PYTHON         = $(or $(wildcard $(VENV_PYTHON)), $(SYSTEM_PYTHON))
VENV_ACTIVATE  = . $(VENV)/bin/activate;

## help: Display this help message
help:
	@echo "Austin Bus Go - Makefile Commands"
	@echo ""
	@echo "Setup:"
	@sed -n 's/^## //p' $(MAKEFILE_LIST) | column -t -s ':' | sed 's/^/  /'
	@echo ""
	@echo "Run 'make <command>' to execute a command."

.PHONY: help

## Dev/build environment
$(VENV_PYTHON):
	rm -rf $(VENV)
	$(SYSTEM_PYTHON) -m venv $(VENV)

## venv: Create Python virtual environment
venv: $(VENV_PYTHON)

## deps: Install Python dependencies from server[dev]
deps:
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -e "server[dev]"

.PHONY: venv deps

## run: Start FastAPI dev server with auto-reload (port 5001)
run: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
run:
	$(VENV_ACTIVATE) uvicorn server.main:app --reload --port 5001

## run-prod: Start production server with Gunicorn + UvicornWorker (port 5001)
run-prod: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
run-prod:
	$(VENV_ACTIVATE) gunicorn --bind=127.0.0.1:5001 --workers 4 \
	    --worker-class uvicorn.workers.UvicornWorker server.main:app

## test: Run unit tests
test:
	$(PYTHON) -m pytest server/tests

## integration-tests: Run integration tests
integration-tests:
	$(PYTHON) -m pytest integration-tests

## coverage: Run tests and generate coverage report
coverage:
	$(VENV_ACTIVATE) coverage run -m pytest server/tests; coverage report

## coverage-html: Run tests and generate HTML coverage report
coverage-html:
	$(VENV_ACTIVATE) coverage run -m pytest server/tests; coverage html

## lint: Format Python code with Black
lint:
	$(VENV_ACTIVATE) black server etl

## etl-download: Download GTFS data from CapMetro
etl-download:
	$(PYTHON) etl/download.py

## etl-prepare: Prepare GTFS data
etl-prepare:
	$(PYTHON) etl/prepare.py

## etl-load: Load prepared GTFS data into database
etl-load: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
etl-load:
	$(PYTHON) etl/load_db.py

## etl: Run full ETL pipeline (download, prepare, load)
etl: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
etl:
	$(PYTHON) etl/main.py

## db-up: Start PostgreSQL database with Docker (port 5438)
db-up:
	docker compose -f docker/compose.db.yml up -d

## setup-local: Complete local setup (database + GTFS data)
setup-local: db-up
	docker compose -f docker/compose.etl.yml run --rm setup-gtfs
	$(MAKE) etl-load
