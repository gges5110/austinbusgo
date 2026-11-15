/**
 * The backend URL to fetch for a request, or undefined to refuse it.
 *
 * Only API paths are forwarded, and always to the backend's own host:
 * resolving the raw path against the origin would let a request for
 * "//other.site/x" fetch https://other.site/x through this worker.
 */
export function upstreamUrl(
  requestUrl: string,
  origin: string,
): URL | undefined {
  const { pathname, search } = new URL(requestUrl);
  if (!pathname.startsWith("/api/")) {
    return undefined;
  }
  const upstream = new URL(origin);
  upstream.pathname = pathname;
  upstream.search = search;
  return upstream;
}
