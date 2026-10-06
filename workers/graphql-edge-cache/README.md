# API Edge Cache

Cloudflare Worker in front of the Cloud Run REST API (`/api/*`). It caches
GET responses at the edge with a per-path TTL (rules in `src/ttl.ts`):

- **15 s**: endpoints that read the GTFS-RT feed (`/api/rt/*`,
  `*/earliest-arrival-times`, `*/upcoming`), matching the feed cadence
- **6 h**: static GTFS data (stops, routes, shapes, search, …)
- **Not cached**: non-`/api/` paths and non-200 responses

Any new endpoint that reads real-time data must be added to the 15 s tier,
or it falls into the 6 h tier and serves stale predictions.

The cache key is `CACHE_VERSION` + path + sorted query string, so parameter
order never splits the cache. Every response carries
`X-Edge-Cache: HIT | MISS | BYPASS`.

`CACHE_VERSION` orphans every cached entry when it changes. The backend
deploy workflow (`.github/workflows/deployBackend.yml`) redeploys this worker
with a fresh value whenever a new GTFS feed ships, then re-warms the cache
(`scripts/warm-cache.mjs`).

> The worker is still named `graphql-edge-cache` from before the REST
> migration; the name is part of its `workers.dev` URL, which the
> `VITE_API_BASE` secret points at.

## Develop

```bash
cd workers/graphql-edge-cache
npm install
npm run dev        # local worker on http://localhost:8787
npm test           # TTL rules (Node's built-in test runner)
```

Point the client at it with `VITE_API_BASE=http://localhost:8787`.

## Deploy

Deploys are manual. Always pass a fresh `CACHE_VERSION`; a plain deploy
resets it to the `"v1"` in `wrangler.toml`:

```bash
npx wrangler deploy --var CACHE_VERSION:manual-$(date +%s)
node scripts/warm-cache.mjs   # optional: refill the cache
```

`wrangler` needs a login (`npx wrangler login`, interactive) or a
`CLOUDFLARE_API_TOKEN` with Workers Scripts: Edit.
