/**
 * Writes a static HTML page for every stop and route into build/, plus a
 * sitemap. Run after `vite build` (npm run prerender).
 *
 * Data comes from the production API (VITE_API_BASE, else the edge cache),
 * the same source the app itself reads.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  routePage,
  routePath,
  sitemap,
  stopPage,
  stopPath,
  stopsByRoute,
} from "./pages.mjs";

const BUILD_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../build");
const API_BASE =
  process.env.VITE_API_BASE ||
  "https://graphql-edge-cache.gges5110.workers.dev";

// A feed with fewer stops than this means a broken API response; fail the
// build rather than replacing thousands of pages with a handful
const MIN_EXPECTED_STOPS = 500;

const getJson = async (path) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "User-Agent": "austinbusgo-prerender" },
  });
  if (!response.ok) {
    throw new Error(`${path}: HTTP ${response.status}`);
  }
  return response.json();
};

/** /stop/1002 → build/stop/1002.html (GitHub Pages serves it at /stop/1002) */
const writePage = async (path, html) => {
  const file = join(BUILD_DIR, `${path}.html`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
};

const main = async () => {
  const template = await readFile(join(BUILD_DIR, "index.html"), "utf8");
  const [stops, routes] = await Promise.all([
    getJson("/api/stops"),
    getJson("/api/routes"),
  ]);

  // Stops no route serves would be empty pages
  const servedStops = stops.filter((stop) => (stop.routes ?? []).length > 0);
  if (servedStops.length < MIN_EXPECTED_STOPS) {
    throw new Error(
      `Only ${servedStops.length} served stops from ${API_BASE}; refusing to prerender`
    );
  }

  const stopsOnRoute = stopsByRoute(servedStops);
  const servedRoutes = routes.filter((route) =>
    stopsOnRoute.has(route.routeId)
  );

  for (const stop of servedStops) {
    await writePage(stopPath(stop), stopPage(template, stop));
  }
  for (const route of servedRoutes) {
    await writePage(
      routePath(route),
      routePage(template, route, stopsOnRoute.get(route.routeId))
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const paths = [
    "/",
    ...servedRoutes.map(routePath),
    ...servedStops.map(stopPath),
  ];
  await writeFile(join(BUILD_DIR, "sitemap.xml"), sitemap(paths, today));

  console.log(
    `Prerendered ${servedStops.length} stop pages and ${servedRoutes.length} ` +
      `route pages; sitemap has ${paths.length} URLs (data: ${API_BASE})`
  );
};

main().catch((error) => {
  console.error(`prerender failed: ${error.message}`);
  process.exit(1);
});
