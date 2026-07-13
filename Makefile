export PYTHONPATH := ./server

# Variables
VENV                = venv
VENV_PYTHON         = $(VENV)/bin/python
SYSTEM_PYTHON       = $(or $(shell which python3), $(shell which python))
PYTHON              = $(or $(wildcard $(VENV_PYTHON)), $(SYSTEM_PYTHON))
VENV_ACTIVATE       = . $(VENV)/bin/activate;
LOCAL_DATABASE_URL  = postgresql://local-user:local-password@localhost:5438/local-db

# ============================================================================
# Help
# ============================================================================

## help: Display this help message
help:
	@printf "Austin Bus Go - Makefile Commands\n"
	@awk 'BEGIN {FS = ":.*## "} \
		/^##@/ {printf "\n%s:\n", substr($$0, 5); next} \
		/^[a-zA-Z0-9_-]+:.*## / {printf "  %-16s %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@printf "\nRun 'make <command>' to execute a command.\n"

.PHONY: help

# ============================================================================
# Setup & Environment
# ============================================================================

##@ Setup & Environment

$(VENV_PYTHON):
	rm -rf $(VENV)
	$(SYSTEM_PYTHON) -m venv $(VENV)

setup-env: $(VENV_PYTHON)  ## Create the Python virtual environment
	@:

install-deps: $(VENV_PYTHON)  ## Install Python dependencies into the venv (server[dev])
	$(VENV_PYTHON) -m pip install --upgrade pip
	$(VENV_PYTHON) -m pip install -e "server[dev]"

setup: install-deps start-db update-db  ## First-time setup: venv + deps + database + GTFS data

.PHONY: setup-env install-deps setup

# ============================================================================
# Database & Data
# ============================================================================

##@ Database & Data

start-db:  ## Start the PostgreSQL database with Docker (port 5438)
	docker compose -f docker/compose.db.yml up -d

# Download the latest GTFS feed, preprocess it, and (re)load it into the local
# database. Runs from etl/ so load.sql's `\copy ./capmetro/...` paths resolve.
# etl/main.py is pure-stdlib, so the system Python is enough; abspath keeps the
# interpreter valid after the cd. load_db.py skips the reload if the feed is
# unchanged. Mirrors the CI pipeline in .github/workflows/updateGTFS.yml.
update-db: export DATABASE_URL=$(LOCAL_DATABASE_URL)
update-db: start-db  ## Download the latest GTFS feed and (re)load the local DB
	cd etl && $(abspath $(PYTHON)) main.py

.PHONY: start-db update-db

# ============================================================================
# Backend
# ============================================================================

##@ Backend

start-be: export DATABASE_URL=$(LOCAL_DATABASE_URL)
start-be:  ## Start the FastAPI backend with auto-reload (port 5001)
	$(VENV_ACTIVATE) uvicorn server.main:app --reload --port 5001

start-prod: export DATABASE_URL=$(LOCAL_DATABASE_URL)
start-prod:  ## Start the production server (Gunicorn + UvicornWorker, port 5001)
	$(VENV_ACTIVATE) gunicorn --bind=127.0.0.1:5001 --workers 4 \
	    --worker-class uvicorn.workers.UvicornWorker server.main:app

format:  ## Format Python code with Black
	$(VENV_ACTIVATE) black server etl

.PHONY: start-be start-prod format

# ============================================================================
# Frontend
# ============================================================================

##@ Frontend

start-fe:  ## Start the frontend dev server with Vite (port 5173)
	cd client && npm start

build-fe:  ## Build the frontend for production
	cd client && npm run build

test-fe:  ## Run frontend tests with Vitest
	cd client && npm test

generate:  ## Export the OpenAPI spec and regenerate typed API hooks (orval)
	cd client && npm run generate

.PHONY: start-fe build-fe test-fe generate

# ============================================================================
# Testing
# ============================================================================

##@ Testing

test:  ## Run backend unit tests
	$(PYTHON) -m pytest server/tests

test-integration:  ## Run backend integration tests
	$(PYTHON) -m pytest integration-tests

coverage:  ## Run unit tests and print a coverage report
	$(VENV_ACTIVATE) coverage run -m pytest server/tests; coverage report

coverage-html:  ## Run unit tests and generate an HTML coverage report
	$(VENV_ACTIVATE) coverage run -m pytest server/tests; coverage html

.PHONY: test test-integration coverage coverage-html
