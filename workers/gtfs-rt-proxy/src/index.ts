/**
 * GTFS-RT CORS proxy
 *
 * The CapMetro GTFS-RT feeds on data.texas.gov respond with a 302 redirect
 * whose response carries no Access-Control-Allow-Origin header, so browsers
 * abort cross-origin fetches on the first hop. This worker fetches the feed
 * server-side (where CORS doesn't apply), caches it at the edge for 15
 * seconds, and relays the protobuf bytes with permissive CORS headers.
 *
 * Routes:
 *   GET /vehicle-positions
 *   GET /trip-updates
 */

const FEEDS: Record<string, string> = {
  "/vehicle-positions":
    "https://data.texas.gov/download/eiei-9rpf/application%2Foctet-stream",
  "/trip-updates":
    "https://data.texas.gov/download/rmk2-acnw/application%2Foctet-stream",
};

// Matches the frontend's 15s polling interval: at most one upstream fetch
// per feed per interval, shared by all clients.
const CACHE_TTL_SECONDS = 15;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export default {
  async fetch(request: Request, _env: unknown, ctx: ExecutionContext) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (request.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: CORS_HEADERS,
      });
    }

    const { pathname } = new URL(request.url);
    const upstreamUrl = FEEDS[pathname];
    if (!upstreamUrl) {
      return new Response(
        `Not found. Available feeds: ${Object.keys(FEEDS).join(", ")}`,
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Normalized cache key so query strings don't fragment the cache
    const cacheKey = new Request(new URL(pathname, request.url).toString());
    const cache = caches.default;

    let response = await cache.match(cacheKey);
    if (!response) {
      const upstream = await fetch(upstreamUrl, { redirect: "follow" });
      if (!upstream.ok) {
        return new Response(
          `Upstream feed error: ${upstream.status} ${upstream.statusText}`,
          { status: 502, headers: CORS_HEADERS }
        );
      }

      response = new Response(upstream.body, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/octet-stream",
          "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
        },
      });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  },
};
