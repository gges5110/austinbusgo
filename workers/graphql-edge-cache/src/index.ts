/**
 * GraphQL edge cache
 *
 * Sits in front of the Cloud Run GraphQL backend and caches read-query
 * responses at the Cloudflare edge. CDNs don't cache POSTs (the request
 * body — where a GraphQL query's identity lives — is not part of the
 * default cache key), so this worker builds its own key from the operation
 * name + a hash of the request body, and applies a per-operation TTL.
 *
 * - Operations not in the TTL table (and anything that fails to parse, or
 *   any mutation) are forwarded to the backend uncached.
 * - GraphQL error responses (200 with an `errors` array) are never cached.
 * - `X-Edge-Cache: HIT | MISS | BYPASS` reports what happened.
 *
 * All data served by the backend is public and identical for every user,
 * which is what makes shared caching safe here.
 */

interface Env {
  UPSTREAM_GRAPHQL_URL: string;
}

/**
 * Per-operation TTLs in seconds.
 *
 * 15s tier: resolvers that read the GTFS-RT feed (matches its cadence).
 * 6h tier: static GTFS data that only changes when the feed is reloaded.
 *
 * Bump CACHE_VERSION after a GTFS reload to drop all static entries early.
 */
const TTL_SECONDS: Record<string, number> = {
  // Real-time (GTFS-RT backed)
  ArrivalTimes: 15,
  EarliestArrivalTimesOnRoute: 15,
  RealTimeVehiclePositions: 15,
  TripUpdate: 15,
  VehiclePositions: 15,
  // Static GTFS data
  DistinctTrips: 21600,
  FeedInfo: 21600,
  NearByStops: 21600,
  Route: 21600,
  Routes: 21600,
  Search: 21600,
  Stop: 21600,
  Stops: 21600,
  StopsAndShapes: 21600,
  StopsByName: 21600,
  StopTimes: 21600,
  Trip: 21600,
  TripIdsForRoute: 21600,
};

const CACHE_VERSION = "v1";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface GraphQLRequestBody {
  query?: string;
  operationName?: string;
  variables?: unknown;
}

function extractOperation(body: GraphQLRequestBody): {
  name: string | undefined;
  isMutation: boolean;
} {
  const query = body.query ?? "";
  const keywordMatch = /^\s*(query|mutation|subscription)\b/.exec(query);
  const isMutation =
    keywordMatch !== null && keywordMatch[1] !== "query";
  const name =
    body.operationName ??
    /(?:query|mutation|subscription)\s+([A-Za-z0-9_]+)/.exec(query)?.[1];
  return { name, isMutation };
}

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

    const forward = (body?: string) =>
      fetch(env.UPSTREAM_GRAPHQL_URL, {
        method: request.method,
        headers: { "Content-Type": "application/json" },
        body: body ?? null,
      });

    if (request.method !== "POST") {
      return withEdgeCacheHeaders(await forward(), "BYPASS");
    }

    const bodyText = await request.text();
    let body: GraphQLRequestBody;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return withEdgeCacheHeaders(await forward(bodyText), "BYPASS");
    }

    const { name, isMutation } = extractOperation(body);
    const ttl = name !== undefined ? TTL_SECONDS[name] : undefined;
    if (isMutation || ttl === undefined) {
      return withEdgeCacheHeaders(await forward(bodyText), "BYPASS");
    }

    // Synthetic GET key: operation name for observability, body hash for
    // identity (covers variables and the query text itself)
    const cacheKey = new Request(
      new URL(
        `/__gql-cache/${CACHE_VERSION}/${name}/${await sha256Hex(bodyText)}`,
        request.url
      ).toString()
    );
    const cache = caches.default;

    const cached = await cache.match(cacheKey);
    if (cached) {
      return withEdgeCacheHeaders(cached, "HIT");
    }

    const upstream = await forward(bodyText);
    if (!upstream.ok) {
      return withEdgeCacheHeaders(upstream, "MISS");
    }

    const responseText = await upstream.text();

    // Never cache GraphQL errors (they arrive as 200s with an errors array)
    let cacheable = false;
    try {
      cacheable = !("errors" in JSON.parse(responseText));
    } catch {
      cacheable = false;
    }

    const response = new Response(responseText, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${ttl}`,
        "X-Edge-Cache": "MISS",
      },
    });
    if (cacheable) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }
    return response;
  },
};
