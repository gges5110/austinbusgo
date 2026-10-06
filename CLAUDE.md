# Austin Bus Location

This project provides real-time bus location tracking for Austin, Texas using CapMetro GTFS data. It consists of a React TypeScript frontend and a Python FastAPI backend with a REST (OpenAPI) API.

## Project Overview

- **Purpose**: Real-time bus tracking application for Austin's CapMetro transit system
- **Architecture**:
  - Frontend: React 18 with TypeScript, Material-UI, Mapbox GL
  - Backend: FastAPI REST API (OpenAPI), read-only SQLite GTFS database baked into the image
  - Data: GTFS (General Transit Feed Specification) static and real-time feeds

## Directory Structure

```
.
├── client/              # React TypeScript frontend
│   ├── src/
│   │   ├── app/        # App setup, routing, theming
│   │   ├── features/   # Feature-based modules (nearby, search, route, stop, favorites)
│   │   └── shared/     # Shared utilities, hooks, components, API clients
├── server/              # Python FastAPI backend
│   ├── main.py         # FastAPI app entry point
│   ├── database.py     # SQLAlchemy async database setup
│   ├── api/            # REST routers and Pydantic response schemas
│   ├── models/         # SQLAlchemy ORM models
│   ├── services/       # Business logic (GTFS service, RT client)
│   └── tests/          # Unit tests
├── etl/                 # GTFS download/prepare + SQLite database build
└── Makefile            # Development commands
```

## Tech Stack

### Frontend
- **Framework**: React 18.2 with TypeScript 4.5
- **Build Tool**: Vite 6
- **UI Library**: Material-UI v9 (MUI)
- **State Management**: Jotai for global state, React Query (TanStack Query) for server state
- **Routing**: React Router v6
- **Map**: Mapbox GL with react-map-gl
- **API client**: orval-generated react-query hooks from the OpenAPI spec
- **Testing**: Vitest with @testing-library/react
- **Styling**: Emotion (CSS-in-JS)

### Backend
- **Framework**: FastAPI 0.115 with Uvicorn
- **API**: REST with FastAPI routers + Pydantic v2 response models (camelCase aliases)
- **Database**: read-only SQLite file built by the ETL, via SQLAlchemy 2.0 (async) + aiosqlite
- **Real-time Data**: gtfs-realtime-bindings
- **Production Server**: Gunicorn with UvicornWorker
- **Testing**: pytest (integration tests build SQLite fixtures with the real ETL loader)

## Development Workflow

### Initial Setup

```bash
# Install git hooks (Python linting on commit)
./setup-hooks.sh

# First-time backend setup: venv + deps + GTFS database
# (creates the venv, installs server[dev], downloads the feed and builds etl/gtfs.db)
make setup

# Setup client
cd client
npm ci
```

> To later refresh the GTFS data on its own, run `make update-db`.

### Running the Application

```bash
# Terminal 1: Start FastAPI backend (port 5001; builds etl/gtfs.db first if missing)
make start-be

# Terminal 2: Start React frontend (Vite dev server)
make start-fe
```

### Common Commands

Run `make help` to see all available targets organized by category.

**Setup & Environment:**
- `make setup-env` - Create Python virtual environment
- `make install-deps` - Install Python dependencies from server[dev]
- `make setup` - First-time setup: venv + deps + GTFS database

**Database & Data:**
- `make update-db` - Download the latest GTFS feed and rebuild the local SQLite DB (`etl/gtfs.db`)

**Development:**
- `make start-be` - Start FastAPI backend server (port 5001, hot reload)
- `make format` - Format Python code with Black

**Frontend:**
- `make start-fe` - Start Vite dev server (port 5173)
- `make build-fe` - Build frontend for production
- `make test-fe` - Run frontend tests with Vitest
- `make generate` - Regenerate typed API hooks from the OpenAPI spec

**Testing:**
- `make test` - Run Python unit tests with pytest
- `make test-integration` - Run integration tests
- `make coverage` - Run tests and generate coverage report
- `make coverage-html` - Run tests and generate HTML coverage report

**Production:**
- `make start-prod` - Start production server with Gunicorn + UvicornWorker (port 5001)

## Coding Conventions

### Frontend (TypeScript/React)

1. **File Structure**:
   - Feature-based organization under `client/src/features/`
   - Shared code in `client/src/shared/`
   - Component files use PascalCase: `SearchAutocomplete.tsx`
   - Test files co-located: `Bullet.test.tsx`

2. **Import Rules**:
   - **NO relative parent imports** (enforced by ESLint)
   - Use absolute imports from `src/` base: `import { useCurrentRoute } from "shared/hooks/UseCurrentRoute"`
   - Import order: builtin → external → internal → parent → sibling → index (alphabetized)
   - Remove unused imports (enforced by eslint-plugin-unused-imports)

3. **TypeScript**:
   - Strict mode enabled
   - Use interfaces for props and types
   - No explicit return types required on functions (disabled rule)
   - Prefer type inference where possible

4. **React Conventions**:
   - Functional components with hooks
   - Props use PascalCase interfaces: `interface SearchAutocompleteProps`
   - Boolean props always explicit: `<Component open={true} />`
   - Sort JSX props alphabetically (enforced by ESLint)
   - Consistent curly braces for props (always), children (never)

5. **Styling**:
   - Material-UI components with Emotion
   - Use MUI's `sx` prop for inline styles
   - Theme-aware via `useAppTheme` hook

6. **State Management**:
   - Jotai atoms for global UI state
   - React Query for server data fetching/caching
   - Local component state with `useState` for ephemeral UI

7. **Code Quality**:
   - Prettier for formatting (double quotes, trailing commas ES5)
   - ESLint with TypeScript, React, and Prettier plugins
   - Pre-commit hooks via lint-staged (configured in `.githooks/pre-commit`)

### Backend (Python/FastAPI)

1. **Code Style**:
   - Black formatter (line length: default 88)
   - Python 3.11+ features
   - Type hints required (used by FastAPI and Pydantic)

2. **Project Structure**:
   - FastAPI app entry point in `server/main.py`
   - REST routers in `server/api/routers/`
   - Response schemas in `server/api/schemas.py`
   - SQLAlchemy models in `server/models/`
   - Business logic in `server/services/`

3. **Database**:
   - SQLAlchemy 2.0 async ORM over a read-only SQLite file (no database server)
   - Models use `DeclarativeBase` pattern
   - Async sessions via `async_sessionmaker`
   - aiosqlite driver; opened with `mode=ro&immutable=1`
   - Geometries are stored as GeoJSON text; no spatial extension
   - Fuzzy search uses `word_similarity`, a Python port of pg_trgm registered as a SQLite function
   - Environment variable: `GTFS_DB_PATH`

4. **REST API**:
   - Routers per domain in `server/api/routers/`, mounted under `/api`
   - Pydantic v2 response models in `server/api/schemas.py` (camelCase serialization via alias generator)
   - Explicit `operation_id` on each route drives generated client hook names
   - Interactive docs at `/docs`, spec at `/openapi.json`

5. **Testing**:
   - pytest framework
   - Tests in `server/tests/`
   - Coverage with coverage.py
   - Test containers for integration tests

6. **Environment**:
   - Virtual environment in `venv/`
   - Dependencies in `server/pyproject.toml` (install with `pip install -e "server[dev]"`)
   - Configuration in `server/config.py`
   - PYTHONPATH set to `./server` in Makefile

## Important Notes

### Database
- The ETL (`etl/main.py`: download → prepare → build) writes `etl/gtfs.db`, a read-only SQLite file; it is pure-stdlib Python
- Production bakes the file into the backend image (`.github/workflows/deployBackend.yml`); a new feed ships as a redeploy, checked nightly by `updateGTFS.yml`
- Schema changes go in `etl/sql/`; there are no migrations, every build is from scratch

### GTFS Data
- Static GTFS data: routes, stops, schedules
- Real-time data: vehicle positions, trip updates
- Data stored in `etl/capmetro/`

### Git Workflow
- Git hooks installed via `./setup-hooks.sh`
- Pre-commit: Python linting (Black), Prettier for frontend
- Main branch: `main`

### Environment Variables
- `GTFS_DB_PATH`: path to the GTFS SQLite file (required; the Makefile and Dockerfile set it)
- Set in Makefile for local development

## Common Tasks

### Adding a New Frontend Feature
1. Create feature directory under `client/src/features/`
2. Use absolute imports from `src/`
3. Extract shared logic to `shared/hooks/` or `shared/components/`
4. Follow ESLint rules (no relative parent imports, sorted props, etc.)
5. Regenerate API hooks if adding endpoints: `npm run generate`

### Adding a New API Endpoint
1. Add the route in the matching router under `server/api/routers/`
2. Add/extend Pydantic response models in `server/api/schemas.py`
3. Reuse or extend business logic in `server/services/`
4. Run code generation in client: `npm run generate` (exports OpenAPI spec + runs orval)

### Updating Dependencies
- Frontend: `cd client && npm update`
- Backend: Update `server/pyproject.toml` and reinstall with `pip install -e "server[dev]"`

### Debugging
- Frontend: Browser DevTools, React DevTools, React Query DevTools
- Backend: Uvicorn hot reload enabled with `make start-be`, SQLAlchemy query logging available via config
- FastAPI auto-generated docs at `http://localhost:5001/docs`

## Testing

### Frontend Tests
```bash
cd client
npm test              # Run tests in watch mode
npm run coverage      # Generate coverage report
```

### Backend Tests
```bash
make test            # Run unit tests
make coverage        # Run tests with coverage report
make integration-tests  # Run integration tests
```

## Key Files to Reference

- [client/src/app/Router.tsx](client/src/app/Router.tsx) - Frontend routing
- [client/src/shared/api/fetcher.ts](client/src/shared/api/fetcher.ts) - API fetch helper used by generated hooks
- [server/main.py](server/main.py) - FastAPI app entry point
- [server/api/routers/__init__.py](server/api/routers/__init__.py) - REST API routers
- [server/database.py](server/database.py) - Database connection
- [client/.eslintrc.json](client/.eslintrc.json) - ESLint configuration
- [client/tsconfig.json](client/tsconfig.json) - TypeScript configuration
- [Makefile](Makefile) - Development commands

## Notes for AI Assistants

- Always use absolute imports in frontend code (from `src/`)
- Sort JSX props alphabetically
- Use double quotes in TypeScript/React code
- Format Python code with Black before committing
- Regenerate API hooks after endpoint changes: `npm run generate`
- Prefer Material-UI components over custom implementations
- Use React Query for server state, Jotai for UI state
- Follow feature-based folder structure for new components
