/**
 * Pre-warm the edge cache after a CACHE_VERSION rotation.
 *
 * Rotating the version orphans every cached entry, so the next visitor
 * would pay the full upstream cost of the expensive endpoints (/api/stops
 * is the big one: ~670KB serialized from ~2,700 stops). This script hits
 * them once so the cache is hot before any user arrives.
 *
 * Run from anywhere: node workers/graphql-edge-cache/scripts/warm-cache.mjs
 */
const WORKER_ORIGIN =
  process.env.WORKER_ORIGIN ?? "https://graphql-edge-cache.gges5110.workers.dev";

const PATHS = ["/api/stops", "/api/routes"];

// Warming is best-effort: failures surface as workflow warning
// annotations but never mark the nightly data load as failed.
for (const path of PATHS) {
  const started = Date.now();
  try {
    const response = await fetch(`${WORKER_ORIGIN}${path}`);
    const elapsed = Date.now() - started;
    const cacheStatus = response.headers.get("X-Edge-Cache");
    const text = await response.text();
    if (!response.ok) {
      console.log(`::warning::Warming ${path} failed (HTTP ${response.status})`);
    } else {
      console.log(
        `Warmed ${path}: ${elapsed}ms, ${text.length} bytes, X-Edge-Cache: ${cacheStatus}`
      );
    }
  } catch (error) {
    console.log(`::warning::Warming ${path} failed: ${error.message}`);
  }
}
