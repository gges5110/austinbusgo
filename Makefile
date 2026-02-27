export PYTHONPATH := ./server

# Variables
VENV           = venv
VENV_PYTHON    = $(VENV)/bin/python
SYSTEM_PYTHON  = $(or $(shell which python3), $(shell which python))
PYTHON         = $(or $(wildcard $(VENV_PYTHON)), $(SYSTEM_PYTHON))
VENV_ACTIVATE  = . $(VENV)/bin/activate;

# ============================================================================
# Help
# ============================================================================

## help: Display this help message
help:
	@echo "Austin Bus Go - Makefile Commands"
	@echo ""
	@echo "Setup & Environment:"
	@grep "^## setup-env\|^## install-deps\|^## setup:" $(MAKEFILE_LIST) | sed 's/^## /  /' | column -t -s ':'
	@echo ""
	@echo "Database:"
	@grep "^## start-db:" $(MAKEFILE_LIST) | sed 's/^## /  /' | column -t -s ':'
	@echo ""
	@echo "Development:"
	@grep "^## start-dev\|^## format:" $(MAKEFILE_LIST) | sed 's/^## /  /' | column -t -s ':'
	@echo ""
	@echo "Frontend:"
	@grep "^## start-fe\|^## build-fe\|^## test-fe\|^## generate:" $(MAKEFILE_LIST) | sed 's/^## /  /' | column -t -s ':'
	@echo ""
	@echo "Testing:"
	@grep "^## test:\|^## test-integration\|^## coverage" $(MAKEFILE_LIST) | sed 's/^## /  /' | column -t -s ':'
	@echo ""
	@echo "Production:"
	@grep "^## start-prod:" $(MAKEFILE_LIST) | sed 's/^## /  /' | column -t -s ':'
	@echo ""
	@echo "Run 'make <command>' to execute a command."

.PHONY: help

# ============================================================================
# Setup & Environment
# ============================================================================

$(VENV_PYTHON):
	rm -rf $(VENV)
	$(SYSTEM_PYTHON) -m venv $(VENV)

## setup-env: Create Python virtual environment
setup-env: $(VENV_PYTHON)

## install-deps: Install Python dependencies from server[dev]
install-deps:
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -e "server[dev]"

## setup: Complete local setup (database + GTFS data)
setup: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
setup: start-db
	docker compose -f docker/compose.etl.yml run --rm setup-gtfs
	$(PYTHON) etl/load_db.py

.PHONY: setup-env install-deps setup

# ============================================================================
# Database
# ============================================================================

## start-db: Start PostgreSQL database with Docker (port 5438)
start-db:
	docker compose -f docker/compose.db.yml up -d

.PHONY: start-db

# ============================================================================
# Development
# ============================================================================

## start-dev: Start FastAPI dev server with auto-reload (port 5001)
start-dev: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
start-dev:
	$(VENV_ACTIVATE) uvicorn server.main:app --reload --port 5001

## format: Format Python code with Black
format:
	$(VENV_ACTIVATE) black server etl

.PHONY: start-dev format

# ============================================================================
# Frontend
# ============================================================================

## start-fe: Start frontend dev server with Vite (port 5173)
start-fe:
	cd client && npm start

## build-fe: Build frontend for production
build-fe:
	cd client && npm run build

## test-fe: Run frontend tests
test-fe:
	cd client && npm test

## generate: Generate GraphQL TypeScript types
generate:
	cd client && npm run generate

.PHONY: start-fe build-fe test-fe generate

# ============================================================================
# Testing
# ============================================================================

## test: Run unit tests
test:
	$(PYTHON) -m pytest server/tests

## test-integration: Run integration tests
test-integration:
	$(PYTHON) -m pytest integration-tests

## coverage: Run tests and generate coverage report
coverage:
	$(VENV_ACTIVATE) coverage run -m pytest server/tests; coverage report

## coverage-html: Run tests and generate HTML coverage report
coverage-html:
	$(VENV_ACTIVATE) coverage run -m pytest server/tests; coverage html

.PHONY: test test-integration coverage coverage-html

# ============================================================================
# Production
# ============================================================================

## start-prod: Start production server with Gunicorn + UvicornWorker (port 5001)
start-prod: export DATABASE_URL=postgresql://local-user:local-password@localhost:5438/local-db
start-prod:
	$(VENV_ACTIVATE) gunicorn --bind=127.0.0.1:5001 --workers 4 \
	    --worker-class uvicorn.workers.UvicornWorker server.main:app

.PHONY: start-prod
