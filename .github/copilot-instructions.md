# GitHub Copilot Instructions for AustinBusGo

## Project Overview

AustinBusGo is a real-time bus tracking application for Austin, Texas. It provides live bus location data using CapMetro's GTFS (General Transit Feed Specification) and GTFS-RT (Real-Time) data feeds.

## Architecture

This is a full-stack application with:
- **Backend**: Python Flask server with GraphQL API
- **Frontend**: React (TypeScript) application with Vite
- **Database**: PostgreSQL with Peewee ORM
- **Deployment**: AWS (EC2 for server, GitHub Pages for client)
- **Map Integration**: Mapbox GL for map visualization

## Technology Stack

### Backend (Python)
- Flask 2.2.2 - Web framework
- Graphene 3.2.2 - GraphQL implementation
- Peewee 3.13.3 - ORM for PostgreSQL
- Flask-CORS - CORS handling
- GTFS libraries - Transit data processing
- Gunicorn - Production server
- Black - Code formatting
- Coverage - Test coverage reporting

### Frontend (React/TypeScript)
- React 18.2.0 with TypeScript 4.5
- Vite - Build tool and dev server
- Material-UI (MUI) - UI components
- React Router - Routing
- TanStack Query (React Query) - Data fetching
- Mapbox GL / React Map GL - Map visualization
- GraphQL Request - GraphQL client
- Jotai - State management
- Vitest - Testing framework
- ESLint & Prettier - Code quality

## Development Setup

### Prerequisites
- Python 3.x
- Node.js 18.x
- Docker and Docker Compose (for local database)
- PostgreSQL

### Initial Setup
1. Install git hooks: `./setup-hooks.sh` (enables Python linting on commit)
2. Setup Python virtual environment: `make venv`
3. Install Python dependencies: `make deps`

### Database Setup
- Setup and start local database: `make setup-local`
- Requires GTFS CSV files in `ci-job/capmetro` directory
- Database runs on Docker at `postgresql://local-user:local-password@localhost:5438/local-db`

### Running the Application

#### Server
- Development: `make run` (Flask debug mode, port 5001)
- Production: `make run-prod` (Gunicorn)
- Environment: Requires `DATABASE_URL` environment variable

#### Client
- Navigate to `client/` directory
- Install dependencies: `npm ci`
- Start dev server: `npm start` (Vite)
- Build: `npm run build`
- Preview production build: `npm run serve`

## Testing

### Python/Backend Tests
- Run all tests: `make test`
- Integration tests: `make integration-tests`
- With coverage: `make coverage`
- HTML coverage report: `make coverage-html`
- Test files: `server/tests/test_*.py`

### TypeScript/Frontend Tests
- Run tests: `npm test` (in client directory)
- With coverage: `npm run coverage`
- CI tests: `npm run test:ci` (includes linting)
- Test framework: Vitest with Testing Library
- Timezone: Tests run with `TZ=UTC`

## Code Quality & Linting

### Python
- Formatter: Black (max line length: 120)
- Command: `make lint`
- Applies to: `server/` and `ci-job/` directories
- Configuration: `server/pyproject.toml`

### TypeScript/JavaScript
- Linter: ESLint with TypeScript rules
- Formatter: Prettier
- Command: `npm run lint` or `npm run lint:fix`
- Configuration: `.eslintrc.json` and `.prettierrc.json`
- Pre-commit hooks: Husky + lint-staged

## Project Structure

```
/
├── .github/              # GitHub workflows and configuration
│   ├── workflows/        # CI/CD pipelines
│   └── dependabot.yml    # Dependency updates config
├── server/               # Python Flask backend
│   ├── models/          # Database models (GTFS and GTFS-RT)
│   ├── gql/             # GraphQL schema and resolvers
│   ├── services/        # Business logic (GTFS services, RT client)
│   ├── tests/           # Unit tests
│   ├── app.py           # Flask application factory
│   ├── database.py      # Database configuration
│   ├── config.py        # Configuration management
│   └── requirements.txt # Python dependencies
├── client/              # React TypeScript frontend
│   ├── src/
│   │   ├── app/         # Main app components, router, query client
│   │   ├── pages/       # Page components
│   │   ├── shared/      # Shared utilities, API schemas
│   │   └── config/      # Frontend configuration
│   ├── public/          # Static assets
│   └── package.json     # Node dependencies and scripts
├── ci-job/              # Data processing scripts
├── docker/              # Docker compose for local database
└── Makefile             # Common development commands
```

## GraphQL API

- Endpoint: `/graphql`
- GraphiQL interface available in development
- Schema defined in `server/gql/schema.py`
- Types: GTFS entities (routes, stops, trips) and real-time updates
- Code generation: Frontend uses GraphQL Code Generator
  - Command: `npm run generate` (in client directory)
  - Config: `client/codegen.ts`

## Data Sources

- GTFS Static Data: CapMetro transit schedule data
- GTFS-RT: Real-time vehicle positions and trip updates
- Download GTFS: `./ci-job/downloadGTFS.sh`
- Preprocessing: `ci-job/prepareGTFSFiles.py`

## CI/CD Workflows

### Main Workflow (main.yml)
- Triggers: Push to `main` branch
- Jobs:
  1. **deploy-client**: Build React app, deploy to GitHub Pages
  2. **build-server**: Build Docker image, push to AWS ECR
  3. **deploy-server**: Deploy to EC2 via SSH

### PR Workflow (onPR.yml)
- Triggers: Pull requests
- Runs tests and checks

### GTFS Update Workflow (updateGTFS.yml)
- Scheduled updates of GTFS data

## Environment Variables

### Server (Production)
- `DATABASE_URL` or separate PG* variables:
  - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGSSLMODE`

### Client (Build-time)
- `VITE_MAPBOX_ACCESS_TOKEN`: Mapbox API token
- `VITE_API_BASE`: Backend API URL

## Best Practices

### Code Style
- Python: Follow Black formatting (120 char line length)
- TypeScript: Follow ESLint/Prettier rules
- Use type hints in Python where appropriate
- Use TypeScript types, avoid `any`

### Testing
- Write unit tests for new features
- Backend: Python unittest framework
- Frontend: Vitest with React Testing Library
- Maintain test coverage
- Use timezone UTC for tests

### Git Workflow
- Use descriptive commit messages
- Pre-commit hooks run automatically (Python linting)
- Keep commits focused and atomic

### GraphQL
- Generate TypeScript types after schema changes: `npm run generate`
- Use GraphQL Code Generator conventions
- Keep resolvers in `server/gql/resolver.py`

### Dependencies
- Backend: Add to `server/requirements.txt`
- Frontend: Use `npm ci` for consistent installs
- Keep dependencies up to date (Dependabot configured)

## Common Tasks

### Adding a New API Endpoint
1. Define GraphQL type in `server/gql/gtfs_types.py` or `gtfs_rt_types.py`
2. Add resolver in `server/gql/resolver.py`
3. Update schema in `server/gql/schema.py`
4. Write tests in `server/tests/`
5. Run `npm run generate` in client to update TypeScript types

### Adding a New Frontend Feature
1. Create components in appropriate `src/` subdirectory
2. Use Material-UI components for consistency
3. Use TanStack Query for data fetching
4. Add GraphQL queries in schema files
5. Write tests with Vitest
6. Run `npm run lint:fix` before committing

### Database Changes
1. Modify models in `server/models/`
2. Update any affected services
3. Test with local database: `make setup-local`
4. Update tests
5. Consider migration strategy for production

## Troubleshooting

### Backend Issues
- Check `DATABASE_URL` is set correctly
- Ensure PostgreSQL is running: `make setup-local`
- Check logs for Flask/Gunicorn errors
- Verify GTFS data is present in `ci-job/capmetro/`

### Frontend Issues
- Clear node_modules and reinstall: `npm ci`
- Check environment variables are set
- Verify backend is running and accessible
- Check browser console for errors
- Rebuild after schema changes: `npm run build`

### Test Failures
- Backend: Run `make test` for detailed output
- Frontend: Check timezone is UTC
- Ensure test database is clean
- Check for async timing issues

## Key Files to Review

- `server/app.py` - Flask app initialization
- `server/gql/schema.py` - GraphQL schema definition
- `client/src/app/App.tsx` - Frontend entry point
- `client/src/app/Router.tsx` - Route definitions
- `Makefile` - Common commands reference
- `.github/workflows/main.yml` - Deployment pipeline
