# GraphQL Edge Cache

Cloudflare Worker that fronts the Cloud Run GraphQL backend and caches read
queries at the edge. GraphQL reads travel over POST, which CDNs won't cache
(the body isn't part of the cache key), so the worker builds its own key —
operation name + SHA-256 of the request body — and applies a per-operation
TTL:

- **15 s**: operations backed by the GTFS-RT feed (`VehiclePositions`,
  `ArrivalTimes`, …), matching the feed cadence
- **6 h**: static GTFS data (`Stops`, `Routes`, `StopsAndShapes`, …)
- **Bypass**: mutations, unknown operations, unparseable bodies

GraphQL error responses (200 + `errors`) are never cached. Every response
carries `X-Edge-Cache: HIT | MISS | BYPASS`.

After a GTFS data reload, bump `CACHE_VERSION` in `src/index.ts` and
redeploy to drop stale static entries before their TTL expires.

## Develop

```bash
cd workers/graphql-edge-cache
npm install
npm run dev        # local worker on http://localhost:8787
```

Point the client at it with `VITE_API_BASE=http://localhost:8787`
(the client appends `/graphql`; the worker accepts any path).

## Deploy

```bash
npm run deploy     # prints the workers.dev URL
```

To route production traffic through the cache, set the `VITE_API_BASE`
GitHub secret to the deployed worker URL.
