/**
 * Edge cache for the REST API
 *
 * Sits in front of the Cloud Run backend and caches GET responses at the
 * Cloudflare edge with a per-path TTL. The cache key includes CACHE_VERSION
 * (rotated by the updateGTFS workflow after each data load) and the request
 * URL with its query parameters sorted, so parameter order never splits the
 * cache.
 *
 * - `X-Edge-Cache: HIT | MISS | BYPASS` reports what happened.
 * - Non-200 responses are never cached.
 * - A legacy POST /graphql passthrough remains (BYPASS, no caching) so this
 *   worker can deploy before or after the backend/frontend during the
 *   GraphQL-to-REST rollout; it will be removed in a follow-up.
 *
 * All data served by the backend is public and identical for every user,
 * which is what makes shared caching safe here.
 */

interface Env {
  UPSTREAM_ORIGIN: string;
  /**
   * Part of every cache key; changing it orphans all cached entries.
   * The updateGTFS workflow redeploys with a fresh value after each data
   * load so static entries don't outlive the GTFS data they came from.
   */
  CACHE_VERSION?: string;
}

/**
 * Per-path TTLs in seconds.
 *
 * 15s tier: endpoints that read the GTFS-RT feed (matches its cadence).
 * 6h tier: static GTFS data that only changes when the feed is reloaded
 * (the updateGTFS workflow rotates CACHE_VERSION after each load).
 */
const RT_TTL = 15;
const STATIC_TTL = 21600;

function ttlForPath(pathname: string): number | undefined {
  if (!pathname.startsWith("/api/")) {
    return undefined;
  }
  if (
    pathname.startsWith("/api/rt/") ||
    pathname.endsWith("/arrival-times") ||
    pathname.endsWith("/earliest-arrival-times")
  ) {
    return RT_TTL;
  }
  return STATIC_TTL;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  // Let page JS read the cache status, not just DevTools
  "Access-Control-Expose-Headers": "X-Edge-Cache",
};

function withEdgeCacheHeaders(
  response: Response,
  status: "HIT" | "MISS" | "BYPASS"
): Response {
  const result = new Response(response.body, response);
  result.headers.set("X-Edge-Cache", status);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    result.headers.set(key, value);
  }
  return result;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const upstreamUrl = new URL(url.pathname + url.search, env.UPSTREAM_ORIGIN);

    // Legacy GraphQL passthrough during the REST rollout (no caching)
    if (request.method !== "GET") {
      const upstream = await fetch(upstreamUrl.toString(), {
        method: request.method,
        headers: { "Content-Type": "application/json" },
        body: await request.text(),
      });
      return withEdgeCacheHeaders(upstream, "BYPASS");
    }

    const ttl = ttlForPath(url.pathname);
    if (ttl === undefined) {
      return withEdgeCacheHeaders(await fetch(upstreamUrl.toString()), "BYPASS");
    }

    // Sort query params so parameter order never splits the cache
    url.searchParams.sort();
    const cacheKey = new Request(
      new URL(
        `/__edge-cache/${env.CACHE_VERSION ?? "v1"}${url.pathname}?${url.searchParams}`,
        request.url
      ).toString()
    );
    const cache = caches.default;

    const cached = await cache.match(cacheKey);
    if (cached) {
      return withEdgeCacheHeaders(cached, "HIT");
    }

    const upstream = await fetch(upstreamUrl.toString());
    if (upstream.status !== 200) {
      return withEdgeCacheHeaders(upstream, "MISS");
    }

    const responseText = await upstream.text();
    const response = new Response(responseText, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${ttl}`,
        "X-Edge-Cache": "MISS",
      },
    });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  },
};
