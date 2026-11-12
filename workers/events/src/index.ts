/**
 * Rider events → Workers Analytics Engine
 *
 * The site posts small anonymous events here ("arrivals shown", "search
 * with no results", …) so we can tell whether riders found the next bus,
 * which Web Analytics page views can't. One data point per event:
 *
 *   index1  event name
 *   blob1   event name        blob2  session (random, per tab)
 *   blob3   page type         blob4–7 event fields (see EVENTS)
 *   blob8   country
 *   double1 event value (e.g. ms until arrivals showed)
 *   double2 visits by this device in the last 7 days
 *
 * No IP, user agent, location or persistent ID is stored.
 *
 * Route: POST /e  body: JSON {e, s, p, f: [..4], v?, n?}, sent as
 * text/plain via navigator.sendBeacon (a "simple" request, no preflight).
 */

interface Env {
  EVENTS: AnalyticsEngineDataset;
}

/** Allowed events, each with the meaning of its 4 fields */
export const EVENTS: Record<string, string[]> = {
  // How the visit started: source (search/social/link/direct), referrer
  // host, returning (yes/no)
  land: ["source", "referrer", "returning", ""],
  // A next-bus answer appeared: has buses (yes/no), live (yes/no), stop,
  // route.  v = ms since landing
  arrivals: ["has_buses", "live", "stop", "route"],
  // The rider opened a bus to see where it is
  bus_tap: ["status", "stop", "route", ""],
  // A search ran: term, result count bucket (0/1/2-5/6+)
  search: ["term", "results", "", ""],
  // The rider picked a search result: kind (stop/route/term), position
  search_pick: ["kind", "position", "id", ""],
  // Location prompt outcome: granted/denied/unavailable, screen
  location: ["result", "screen", "", ""],
  // The rider chose their stop on a route page: how (location/pick/remembered)
  route_stop: ["how", "route", "stop", ""],
  // Saved a stop or route, or copied a link
  save: ["kind", "id", "", ""],
  share: ["kind", "id", "", ""],
};

const PAGE_TYPES = new Set([
  "nearby",
  "stop",
  "route",
  "trip",
  "search",
  "saved",
  "recent",
  "map",
  "other",
]);

const ALLOWED_ORIGINS = new Set([
  "https://austinbusgo.com",
  "https://www.austinbusgo.com",
]);

const MAX_FIELD = 64;
const MAX_BODY = 2048;

const clean = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? String(value).slice(0, MAX_FIELD)
    : "";

const num = (value: unknown, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(value, 0), max)
    : 0;

export interface Point {
  indexes: string[];
  blobs: string[];
  doubles: number[];
}

/** The data point for a request body, or null to drop it */
export const toPoint = (body: unknown, country = ""): Point | null => {
  if (!body || typeof body !== "object") return null;
  const { e, s, p, f, v, n } = body as Record<string, unknown>;
  if (typeof e !== "string" || !(e in EVENTS)) return null;
  const page = typeof p === "string" && PAGE_TYPES.has(p) ? p : "other";
  const fields = Array.isArray(f) ? f : [];
  return {
    indexes: [e],
    blobs: [
      e,
      clean(s),
      page,
      ...[0, 1, 2, 3].map((i) => (EVENTS[e][i] ? clean(fields[i]) : "")),
      clean(country),
    ],
    // An hour is long enough for any "ms since landing"
    doubles: [num(v, 3_600_000), num(n, 100)],
  };
};

export default {
  async fetch(request: Request, env: Env) {
    const origin = request.headers.get("Origin") ?? "";
    if (request.method !== "POST" || new URL(request.url).pathname !== "/e") {
      return new Response("Not found", { status: 404 });
    }
    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response(null, { status: 403 });
    }
    const text = await request.text();
    if (text.length > MAX_BODY) return new Response(null, { status: 413 });

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return new Response(null, { status: 400 });
    }
    const country = (request.cf?.country as string | undefined) ?? "";
    const point = toPoint(body, country);
    if (point) env.EVENTS.writeDataPoint(point);
    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": origin },
    });
  },
};
