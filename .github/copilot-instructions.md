# Copilot Instructions for Austin Bus Go

Real-time bus tracking for Austin's CapMetro system. The full, maintained
project guide is [`CLAUDE.md`](../CLAUDE.md) at the repo root; this file is a
short summary of it.

## Stack

- **Frontend** (`client/`): React 18 + TypeScript, Vite, Material-UI with
  Emotion, Mapbox GL via react-map-gl, Jotai (UI state), TanStack Query
  (server state), React Router v6, Vitest.
- **API client**: orval-generated react-query hooks in
  `client/src/shared/api/generated/`, built from the committed
  `client/openapi.json`. Regenerate with `npm run generate` (or
  `make generate`) after changing endpoints or response models.
- **Backend** (`server/`): FastAPI REST API under `/api`, with Pydantic v2
  response models (camelCase JSON) in `server/api/schemas.py`. Data comes from
  a read-only SQLite GTFS database through SQLAlchemy 2.0 async + aiosqlite.
  Real-time data comes from CapMetro's GTFS-RT feeds.
- **Data** (`etl/`): `python etl/main.py` downloads the GTFS feed and builds
  `etl/gtfs.db`, which ships inside the backend Docker image.
- **Edge**: Cloudflare Workers cache the API (`workers/graphql-edge-cache`)
  and proxy GTFS-RT (`workers/gtfs-rt-proxy`).

## Conventions

- Frontend imports are absolute from `src/` (no relative parent imports).
- JSX props are sorted alphabetically; boolean props are explicit
  (`open={true}`).
- Double quotes; Prettier formatting. Python is formatted with Black.
- Features live under `client/src/features/<feature>/`; shared code lives in
  `client/src/shared/`.
- New endpoints go in `server/api/routers/` with an explicit `operation_id`,
  which names the generated hook.

## Commands

```bash
make setup        # venv, deps, GTFS database
make start-be     # API on :5001
make start-fe     # Vite dev server
make test         # backend unit tests
make test-integration
cd client && npm test
```
