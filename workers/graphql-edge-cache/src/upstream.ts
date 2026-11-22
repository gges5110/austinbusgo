/**
 * Query parameters the API reads (see the generated client's *Params
 * types). Anything else is dropped before the cache key and the upstream
 * request, so `?x=<random>` can't turn every request into a cache miss.
 */
export const API_PARAMS = new Set([
  "date",
  "direction",
  "direction_id",
  "limit",
  "max_lat",
  "max_lon",
  "min_lat",
  "min_lon",
  "name",
  "q",
  "route_id",
  "time",
]);

/**
 * The backend URL to fetch for a request, or undefined to refuse it.
 *
 * Only API paths are forwarded, and always to the backend's own host:
 * resolving the raw path against the origin would let a request for
 * "//other.site/x" fetch https://other.site/x through this worker. Only
 * the API's own query parameters go along, sorted, so the URL doubles as
 * a cache key.
 */
export function upstreamUrl(
  requestUrl: string,
  origin: string,
): URL | undefined {
  const { pathname, searchParams } = new URL(requestUrl);
  if (!pathname.startsWith("/api/")) {
    return undefined;
  }
  const upstream = new URL(origin);
  upstream.pathname = pathname;
  for (const [key, value] of searchParams) {
    if (API_PARAMS.has(key)) upstream.searchParams.append(key, value);
  }
  upstream.searchParams.sort();
  return upstream;
}
