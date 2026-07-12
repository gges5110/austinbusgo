/**
 * Pre-warm the edge cache after a CACHE_VERSION rotation.
 *
 * Rotating the version orphans every cached entry, so the next visitor
 * would pay the full upstream cost of the expensive queries (AllStops is
 * the big one: ~670KB serialized from ~2,700 stops). This script replays
 * those queries once so the cache is hot before any user arrives.
 *
 * The query text is read from the client source files, so the warmed
 * entry always matches what the deployed frontend sends (the worker
 * normalizes whitespace and variable ordering when building cache keys).
 *
 * Run from the repo root: node workers/graphql-edge-cache/scripts/warm-cache.mjs
 */
import { readFileSync } from "node:fs";

const WORKER_URL =
  process.env.WORKER_URL ??
  "https://graphql-edge-cache.gges5110.workers.dev/graphql";

const QUERIES = [
  { name: "AllStops", file: "client/src/shared/api/schemas/AllStops.tsx" },
];

function extractGqlTemplate(file) {
  const source = readFileSync(file, "utf8");
  const match = /gql`([^`]+)`/.exec(source);
  if (!match) {
    throw new Error(`No gql template literal found in ${file}`);
  }
  return match[1];
}

// Warming is best-effort: failures surface as workflow warning
// annotations but never mark the nightly data load as failed.
for (const { name, file } of QUERIES) {
  const query = extractGqlTemplate(file);
  const started = Date.now();
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operationName: name, query, variables: {} }),
    });
    const elapsed = Date.now() - started;
    const cacheStatus = response.headers.get("X-Edge-Cache");
    const text = await response.text();
    const hasErrors = (() => {
      try {
        return "errors" in JSON.parse(text);
      } catch {
        return true;
      }
    })();
    if (!response.ok || hasErrors) {
      console.log(
        `::warning::Warming ${name} failed (HTTP ${response.status}, errors=${hasErrors})`
      );
    } else {
      console.log(
        `Warmed ${name}: ${elapsed}ms, ${text.length} bytes, X-Edge-Cache: ${cacheStatus}`
      );
    }
  } catch (error) {
    console.log(`::warning::Warming ${name} failed: ${error.message}`);
  }
}
