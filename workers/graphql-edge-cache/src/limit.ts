/**
 * Per-IP limit on requests that reach the backend (cache misses and
 * uncached paths). Cache hits are never limited: they cost the backend
 * nothing. A rider polls every 15s, so even a cold cache stays far below
 * it; a script hammering uncached URLs from one address does not.
 *
 * The numbers live in wrangler.toml ([[ratelimits]] MISS_LIMITER).
 */
export async function overLimit(
  request: Request,
  limiter: RateLimit | undefined,
): Promise<boolean> {
  // No binding (local dev, tests): no limit
  if (!limiter) return false;
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) return false;
  const { success } = await limiter.limit({ key: ip });
  return !success;
}
