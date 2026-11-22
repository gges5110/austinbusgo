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
 * - Requests that would reach the backend are rate limited per IP (429).
 * - Upstream requests carry ORIGIN_SECRET, which the backend requires, so
 *   the Cloud Run URL can't be hit directly to get around this worker.
 *
 * All data served by the backend is public and identical for every user,
 * which is what makes shared caching safe here.
 */

import { overLimit } from "./limit";
import { ttlForPath } from "./ttl";
import { upstreamUrl as toUpstream } from "./upstream";

interface Env {
  UPSTREAM_ORIGIN: string;
  /**
   * Part of every cache key; changing it orphans all cached entries.
   * The updateGTFS workflow redeploys with a fresh value after each data
   * load so static entries don't outlive the GTFS data they came from.
   */
  CACHE_VERSION?: string;
  /** Sent to the backend as X-Origin-Auth (a worker secret) */
  ORIGIN_SECRET?: string;
  /** Per-IP limit on backend-bound requests (wrangler.toml) */
  MISS_LIMITER?: RateLimit;
}

const RETRY_AFTER_SECONDS = 60;

function fetchUpstream(url: URL, env: Env): Promise<Response> {
  return fetch(url.toString(), {
    headers: env.ORIGIN_SECRET ? { "X-Origin-Auth": env.ORIGIN_SECRET } : {},
  });
}

function tooManyRequests(): Response {
  return new Response("Too Many Requests", {
    status: 429,
    headers: { ...CORS_HEADERS, "Retry-After": String(RETRY_AFTER_SECONDS) },
  });
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
  status: "HIT" | "MISS" | "BYPASS",
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
    const upstreamUrl = toUpstream(request.url, env.UPSTREAM_ORIGIN);
    if (!upstreamUrl) {
      return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    }

    if (request.method !== "GET") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: CORS_HEADERS,
      });
    }

    const ttl = ttlForPath(url.pathname);
    if (ttl === undefined) {
      if (await overLimit(request, env.MISS_LIMITER)) return tooManyRequests();
      return withEdgeCacheHeaders(
        await fetchUpstream(upstreamUrl, env),
        "BYPASS",
      );
    }

    // The upstream URL's query is filtered and sorted, so unknown or
    // reordered parameters never split the cache
    const cacheKey = new Request(
      new URL(
        `/__edge-cache/${env.CACHE_VERSION ?? "v1"}${url.pathname}${upstreamUrl.search}`,
        request.url,
      ).toString(),
    );
    const cache = caches.default;

    const cached = await cache.match(cacheKey);
    if (cached) {
      return withEdgeCacheHeaders(cached, "HIT");
    }

    if (await overLimit(request, env.MISS_LIMITER)) return tooManyRequests();
    const upstream = await fetchUpstream(upstreamUrl, env);
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
