# Austin Bus Location

This project provides real-time bus location tracking for Austin, Texas using CapMetro GTFS data. It consists of a React TypeScript frontend and a Python Flask backend with GraphQL API.

## Project Overview

- **Purpose**: Real-time bus tracking application for Austin's CapMetro transit system
- **Architecture**:
  - Frontend: React 18 with TypeScript, Material-UI, Mapbox GL
  - Backend: Flask with GraphQL (Graphene), PostgreSQL database
  - Data: GTFS (General Transit Feed Specification) static and real-time feeds

## Directory Structure

```
.
├── client/              # React TypeScript frontend
│   ├── src/
│   │   ├── app/        # App setup, routing, theming
│   │   ├── features/   # Feature-based modules (search, route, stop, favorites)
│   │   └── shared/     # Shared utilities, hooks, components, API clients
├── server/              # Python Flask backend
│   ├── app.py          # Flask app factory
│   ├── gql/            # GraphQL schema and resolvers
│   ├── models/         # Peewee ORM models
│   ├── services/       # Business logic (GTFS service, RT client)
│   └── tests/          # Unit tests
├── etl/                 # GTFS data download, prepare, and load scripts
├── docker/              # Docker Compose files for PostgreSQL
└── Makefile            # Development commands
```

## Tech Stack

### Frontend
- **Framework**: React 18.2 with TypeScript 4.5
- **Build Tool**: Vite 6
- **UI Library**: Material-UI v6 (MUI)
- **State Management**: Jotai for global state, React Query (TanStack Query) for server state
- **Routing**: React Router v6
- **Map**: Mapbox GL with react-map-gl
- **GraphQL**: graphql-request with code generation (@graphql-codegen)
- **Testing**: Vitest with @testing-library/react
- **Styling**: Emotion (CSS-in-JS)

### Backend
- **Framework**: Flask 2.2.5
- **API**: GraphQL with Graphene 3.2
- **Database**: PostgreSQL with Peewee ORM
- **Real-time Data**: gtfs-realtime-bindings
- **Production Server**: Gunicorn
- **Testing**: unittest with testcontainers

## Development Workflow

### Initial Setup

```bash
# Install git hooks (Python linting on commit)
./setup-hooks.sh

# Setup PostgreSQL database via Docker
make setup-local

# Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r server/requirements.txt

# Setup client
cd client
npm ci
```

### Running the Application

```bash
# Terminal 1: Start PostgreSQL (if not running)
make setup-local

# Terminal 2: Start Flask backend (port 5001)
make run

# Terminal 3: Start React frontend (Vite dev server)
cd client
npm start
```

### Common Commands

**Backend:**
- `make run` - Run Flask dev server (port 5001)
- `make test` - Run Python unit tests
- `make coverage` - Generate test coverage report
- `make lint` - Format Python code with Black
- `make etl-download` - Download GTFS data from CapMetro

**Frontend (in client/ directory):**
- `npm start` - Start Vite dev server
- `npm run build` - Production build
- `npm test` - Run tests with Vitest
- `npm run coverage` - Generate test coverage
- `npm run lint` - Lint TypeScript/React code
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run generate` - Generate GraphQL TypeScript types

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

### Backend (Python/Flask)

1. **Code Style**:
   - Black formatter (line length: default 88)
   - Python 3.11+ features
   - Type hints encouraged (typing module available)

2. **Project Structure**:
   - Flask app factory pattern in `app.py`
   - GraphQL schema in `server/gql/schema.py`
   - Peewee models in `server/models/`
   - Business logic in `server/services/`

3. **Database**:
   - Peewee ORM with PostgreSQL
   - Models inherit from Peewee base models
   - Database connection managed by `db_wrapper`
   - Environment variable: `DATABASE_URL`

4. **GraphQL API**:
   - Schema defined with Graphene
   - Types in `gql/gtfs_types.py`, `gql/gtfs_rt_types.py`, `gql/geometry_types.py`
   - Resolvers in `gql/resolver.py`
   - GraphiQL enabled in development

5. **Testing**:
   - Standard unittest framework
   - Tests in `server/tests/`
   - Coverage with coverage.py
   - Test containers for integration tests

6. **Environment**:
   - Virtual environment in `venv/`
   - Dependencies in `requirements.txt`
   - Configuration in `server/config.py`
   - PYTHONPATH set to `./server` in Makefile

## Important Notes

### Database
- PostgreSQL runs on port 5438 (to avoid conflicts with default 5432)
- Default credentials: `local-user:local-password@localhost:5438/local-db`
- Requires GTFS CSV files processed with `preprocessGTFS.py`
- Docker Compose split into `docker/compose.db.yml` (database) and `docker/compose.etl.yml` (GTFS prep job)
- `make db-up` — start PostgreSQL only; `make setup-local` — start DB + run GTFS prep

### GTFS Data
- Static GTFS data: routes, stops, schedules
- Real-time data: vehicle positions, trip updates
- Data stored in `etl/capmetro/`

### Git Workflow
- Git hooks installed via `./setup-hooks.sh`
- Pre-commit: Python linting (Black), Prettier for frontend
- Main branch: `main`

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- Set in Makefile for local development

## Common Tasks

### Adding a New Frontend Feature
1. Create feature directory under `client/src/features/`
2. Use absolute imports from `src/`
3. Extract shared logic to `shared/hooks/` or `shared/components/`
4. Follow ESLint rules (no relative parent imports, sorted props, etc.)
5. Generate GraphQL types if adding queries: `npm run generate`

### Adding a New GraphQL Query/Mutation
1. Update schema in `server/gql/schema.py`
2. Add resolver logic in `server/gql/resolver.py`
3. Add types if needed in `server/gql/*_types.py`
4. Run code generation in client: `npm run generate`

### Updating Dependencies
- Frontend: `cd client && npm update`
- Backend: Update `server/requirements.txt` and reinstall

### Debugging
- Frontend: Browser DevTools, React DevTools, React Query DevTools
- Backend: Flask debug mode enabled with `make run`, Peewee query logging in debug mode
- GraphiQL available at `http://localhost:5001/graphql`

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
- [client/src/shared/api/graphqlClient.ts](client/src/shared/api/graphqlClient.ts) - GraphQL client setup
- [server/app.py](server/app.py) - Flask app factory
- [server/gql/schema.py](server/gql/schema.py) - GraphQL schema
- [server/database.py](server/database.py) - Database connection
- [client/.eslintrc.json](client/.eslintrc.json) - ESLint configuration
- [client/tsconfig.json](client/tsconfig.json) - TypeScript configuration
- [Makefile](Makefile) - Development commands

## Notes for AI Assistants

- Always use absolute imports in frontend code (from `src/`)
- Sort JSX props alphabetically
- Use double quotes in TypeScript/React code
- Format Python code with Black before committing
- Generate GraphQL types after schema changes: `npm run generate`
- Prefer Material-UI components over custom implementations
- Use React Query for server state, Jotai for UI state
- Follow feature-based folder structure for new components
