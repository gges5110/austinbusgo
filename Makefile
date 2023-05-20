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

.PHONY: venv deps

run: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
run:
	$(VENV_ACTIVATE) flask --app 'server/app:create_app()' --debug run --port=5001

run-prod: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
run-prod:
	$(VENV_ACTIVATE) gunicorn --bind=127.0.0.1:5001 'server.app:create_app()'

test:
	$(PYTHON) -m unittest discover -s tests

coverage:
	$(VENV_ACTIVATE) coverage run --source=./server -m unittest discover -s tests; coverage report -m

coverage-html:
	$(VENV_ACTIVATE) coverage run --source=./server -m unittest discover -s tests; coverage html

lint:
	$(VENV_ACTIVATE) black server tests ci-job

setup-local:
	docker-compose -f docker/docker-compose.yml up
