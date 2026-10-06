/**
 * Per-path TTLs in seconds.
 *
 * 15s tier: endpoints that read the GTFS-RT feed (matches its cadence).
 * 6h tier: static GTFS data that only changes when the feed is reloaded
 * (the deploy workflow rotates CACHE_VERSION after each new feed).
 *
 * Any new endpoint that reads real-time data must be listed here, or it
 * falls into the 6h tier and serves stale predictions.
 */
export const RT_TTL = 15;
export const STATIC_TTL = 21600;

export function ttlForPath(pathname: string): number | undefined {
  if (!pathname.startsWith("/api/")) {
    return undefined;
  }
  if (
    pathname.startsWith("/api/rt/") ||
    pathname.endsWith("/earliest-arrival-times") ||
    pathname.endsWith("/upcoming")
  ) {
    return RT_TTL;
  }
  return STATIC_TTL;
}
