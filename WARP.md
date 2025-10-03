# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AustinBusGo is a real-time bus tracking application for Austin, Texas that provides bus location data through CapMetro's GTFS feeds. The application consists of a Flask/GraphQL backend serving GTFS transit data and a React frontend with interactive maps.

## Development Commands

### Backend (Python/Flask)
```bash
# Setup local development environment
make setup-local          # Starts PostgreSQL with PostGIS via Docker
make install               # Install Python dependencies (creates venv automatically)
make run                   # Start development server on port 5001
make run-prod              # Start production server with gunicorn

# Testing and Code Quality  
make test                  # Run unit tests
make integration-tests     # Run integration tests
make coverage              # Generate test coverage report
make coverage-html         # Generate HTML coverage report
make lint                  # Format code with black

# GTFS Data Management
make downloadGTFS          # Download latest GTFS data from CapMetro
```

### Frontend (React/TypeScript)
```bash
# From client/ directory
npm ci                     # Install dependencies
npm start                  # Start Vite dev server on port 3000
npm run build              # Build for production
npm test                   # Run Vitest tests
npm run coverage           # Generate test coverage
npm run lint               # Lint TypeScript files
npm run lint:fix           # Auto-fix lint issues
npm run generate           # Generate GraphQL types from schema
```

### Single Test Execution
```bash
# Backend - run specific test file
python -m unittest tests.test_gtfs_service

# Frontend - run specific test file  
npm test -- SearchPanel.test.tsx
```

## Architecture Overview

### Data Flow Architecture
The application follows a layered architecture with clear separation between data access, business logic, and presentation:

1. **GTFS Data Pipeline**: Raw GTFS CSV files from CapMetro → Preprocessed with geometry conversion → PostgreSQL with PostGIS
2. **Real-time Data**: GTFS-RT protobuf feeds → Parsed vehicle positions/trip updates → Cached in services layer
3. **GraphQL API**: Single endpoint exposing all transit data with type-safe schema
4. **React Frontend**: Map-based interface using Mapbox GL with real-time updates

### Backend Structure
- **`server/app.py`**: Flask application factory with GraphQL endpoint and static file serving
- **`server/gql/`**: GraphQL schema definition and resolvers
  - `schema.py`: Main GraphQL schema with all query types
  - `resolver.py`: Business logic for data fetching and processing
  - `*_types.py`: GraphQL type definitions for GTFS entities
- **`server/models/`**: Peewee ORM models mapping to PostgreSQL tables
  - `gtfs_models.py`: Static GTFS data (routes, stops, trips, etc.)
  - `gtfs_rt_models.py`: Real-time GTFS data structures
- **`server/services/`**: Business logic layer
  - `gtfs_service.py`: Database queries for static transit data
  - `gtfs_rt_service.py`: Real-time data processing and caching
  - `gtfs_rt_client.py`: HTTP client for GTFS-RT feeds

### Frontend Structure
- **State Management**: Jotai for atomic state management, React Query for server state
- **Routing**: React Router v6 with type-safe route definitions
- **Maps**: React Map GL (Mapbox) with real-time vehicle position overlays  
- **UI Framework**: Material-UI v5 with custom theming
- **Type Safety**: Full TypeScript with GraphQL code generation

### Key Integration Points
- **GraphQL Code Generation**: `client/codegen.ts` generates TypeScript types and React Query hooks from the backend schema
- **Database Geometry**: PostGIS handles spatial queries for nearby stops and route shapes
- **Real-time Updates**: WebSocket-like polling of GTFS-RT feeds with client-side caching
- **Docker Development**: Local PostgreSQL with sample data via `docker/docker-compose.yml`

## Important Technical Details

### GTFS Data Processing
- The `ci-job/prepareGTFSFiles.py` script transforms CapMetro CSV files:
  - Converts lat/lon coordinates to PostGIS POINT geometries
  - Normalizes time formats to HH:MM:SS
  - Pre-aggregates route shapes for performance
- Database setup requires PostGIS extension for spatial queries
- GTFS-RT feeds are polled from CapMetro's real-time APIs

### Environment Configuration
- Backend requires `DATABASE_URL` environment variable
- Frontend needs `REACT_APP_MAPBOX_ACCESS_TOKEN` in `.env.local`
- Production deployment uses AWS ECR + EC2 (see `AWS_DEPLOYMENT.md`)

### Development Database
- Local development uses PostgreSQL in Docker on port 5438
- Sample data loaded from `ci-job/capmetro/` directory
- Schema defined in `server/database/schema.sql`

### Testing Strategy
- Backend: unittest with test database isolation
- Frontend: Vitest with jsdom environment
- Integration tests verify GraphQL queries against real database
- Test containers used for isolated database testing

### Build and Deployment
- Frontend builds to `client/build/` directory, served by Flask in production
- Docker multi-stage builds for backend and client
- AWS deployment automation in `scripts/` directory
- Production uses gunicorn + nginx for serving

## Common Patterns

### Adding New GraphQL Queries
1. Define types in `server/gql/*_types.py`
2. Add resolver method in `server/gql/resolver.py` 
3. Register query in `server/gql/schema.py`
4. Run `npm run generate` in client to update TypeScript types
5. Use generated React Query hooks in components

### Database Queries
- Use Peewee ORM models in `server/models/`
- Spatial queries leverage PostGIS functions via `peewee.fn`
- Always use parameterized queries to prevent SQL injection
- Index frequently queried fields (route_id, trip_id, stop_id)

### Frontend Data Fetching
- Use generated React Query hooks for all GraphQL operations
- Implement optimistic updates for user interactions
- Cache location data in Jotai atoms for cross-component access
- Handle loading and error states consistently across components