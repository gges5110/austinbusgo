# GTFS-RT CORS Proxy

Cloudflare Worker that relays the CapMetro GTFS-RT protobuf feeds with CORS
headers, so the frontend can fetch real-time data directly without the
backend server.

Why it exists: `data.texas.gov` serves the feeds behind a 302 redirect whose
response has no `Access-Control-Allow-Origin` header, so browsers abort
cross-origin fetches on the first hop. The worker fetches server-side and
caches the bytes at the edge for 15 seconds — all clients share one upstream
fetch per interval.

## Routes

- `GET /vehicle-positions` — proxies the vehicle positions feed
- `GET /trip-updates` — proxies the trip updates feed

## Develop

```bash
cd workers/gtfs-rt-proxy
npm install
npm run dev        # local worker on http://localhost:8787, no login needed
```

Point the client at it with `VITE_GTFS_RT_PROXY_URL=http://localhost:8787`.

## Deploy

```bash
npx wrangler login   # once, opens browser
npm run deploy       # prints the workers.dev URL
```

Then set `VITE_GTFS_RT_PROXY_URL` to the deployed URL in the frontend build
environment (e.g. the GitHub Actions secrets used by the preview deploy).
