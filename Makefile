export PYTHONPATH := ./server

# Variables
VENV           = venv
VENV_PYTHON    = $(VENV)/bin/python
SYSTEM_PYTHON  = $(or $(shell which python3), $(shell which python))
PYTHON         = $(or $(wildcard $(VENV_PYTHON)), $(SYSTEM_PYTHON))
VENV_ACTIVATE  = . $(VENV)/bin/activate;

## Dev/build environment
$(VENV_PYTHON):
	rm -rf $(VENV)
	$(SYSTEM_PYTHON) -m venv $(VENV)

venv: $(VENV_PYTHON)

deps:
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -e "server[dev]"

.PHONY: venv deps

run: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
run:
	$(VENV_ACTIVATE) uvicorn server.main:app --reload --port 5001

run-prod: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
run-prod:
	$(VENV_ACTIVATE) gunicorn --bind=127.0.0.1:5001 --workers 4 \
	    --worker-class uvicorn.workers.UvicornWorker server.main:app

test:
	$(PYTHON) -m pytest server/tests

integration-tests:
	$(PYTHON) -m pytest integration-tests

coverage:
	$(VENV_ACTIVATE) coverage run -m pytest server/tests; coverage report

coverage-html:
	$(VENV_ACTIVATE) coverage run -m pytest server/tests; coverage html

lint:
	$(VENV_ACTIVATE) black server etl

etl-download:
	cd etl && ./download.sh

etl-prepare:
	$(PYTHON) etl/prepare.py

etl-load: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
etl-load:
	etl/load.sh

etl: etl-download etl-prepare etl-load

db-up:
	docker compose -f docker/compose.db.yml up -d

setup-local: db-up
	docker compose -f docker/compose.etl.yml run --rm setup-gtfs
	$(MAKE) etl-load
