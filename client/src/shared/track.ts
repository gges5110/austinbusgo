/**
 * Anonymous rider events (see workers/events): did the rider find the next
 * bus, what did they search for, do they come back.
 *
 * Sends nothing unless the build has VITE_EVENTS_URL (production only), so
 * local dev, tests and PR previews stay silent. No personal ID: a random
 * per-tab session ID and a 7-day visit count kept on this device. Search
 * terms are sent with house-number-like numbers removed (scrubSearchTerm).
 */

export type TrackEvent =
  | "land"
  | "arrivals"
  | "bus_tap"
  | "search"
  | "search_pick"
  | "location"
  | "route_stop"
  | "save"
  | "share";

export type PageType =
  | "nearby"
  | "stop"
  | "route"
  | "trip"
  | "search"
  | "saved"
  | "recent"
  | "map"
  | "other";

type Field = string | number | boolean | undefined | null;

const VISITS_KEY = "visitDays";
const SESSION_KEY = "trackSession";
const WEEK_MS = 7 * 24 * 3600 * 1000;

/** The page type for a pathname, e.g. "/nearby/stop/1002" → "nearby" */
export const pageType = (pathname: string): PageType => {
  const first = pathname.split("/")[1] ?? "";
  if (first === "nearby") return "nearby";
  if (first === "stop") return pathname.includes("/trip/") ? "trip" : "stop";
  if (first === "route") return "route";
  if (first === "search") return "search";
  if (first === "favorites") return "saved";
  if (first === "recent-searches") return "recent";
  if (first === "" || first.startsWith("@")) return "map";
  return "other";
};

const SEARCH_DOMAINS = [
  "bing.com",
  "duckduckgo.com",
  "yahoo.com",
  "ecosia.org",
  "brave.com",
];
const SOCIAL_DOMAINS = [
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "t.co",
  "reddit.com",
  "nextdoor.com",
  "linkedin.com",
  "lnkd.in",
  "threads.net",
  "bsky.app",
];

/** Where the visit came from, by referrer host */
export const visitSource = (referrer: string, ownHost: string) => {
  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname : "";
  } catch {
    host = "";
  }
  if (!host) return { source: "direct", host: "" };
  if (host === ownHost) return { source: "internal", host };
  const onDomain = (domain: string) =>
    host === domain || host.endsWith(`.${domain}`);
  if (/(^|\.)google\./.test(host) || SEARCH_DOMAINS.some(onDomain)) {
    return { source: "search", host };
  }
  if (SOCIAL_DOMAINS.some(onDomain)) return { source: "social", host };
  return { source: "link", host };
};

const safeStorage = (storage: () => Storage) => {
  try {
    return storage();
  } catch {
    return undefined;
  }
};

/** "2026-11-10" in the rider's own time zone (not UTC) */
const localDay = (epochMs: number) => {
  const date = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

// A number followed by a street-like word, unless it's a route ("640 bus")
const HOUSE_NUMBER = /\b\d{2,}\s+(?!(bus|route|schedule|stop)\b)(?=[a-z])/g;

/**
 * A search term safe to keep: lowercased, emails and long numbers (phone,
 * zip) and house numbers ("1234 elm st" → "# elm st") removed. Route
 * numbers and stop IDs on their own ("640", "640 bus", "5869") stay.
 */
export const scrubSearchTerm = (term: string) =>
  term
    .trim()
    .toLowerCase()
    .replace(/\S+@\S+/g, "#")
    .replace(/\d{6,}/g, "#")
    .replace(HOUSE_NUMBER, "# ")
    .replace(/\s+/g, " ")
    .slice(0, 40);

/**
 * Records today as a visit day and returns how many distinct days in the
 * last week (including today) this device visited.
 */
export const countVisitDays = (now = Date.now()) => {
  const storage = safeStorage(() => window.localStorage);
  const today = localDay(now);
  let days: string[] = [];
  try {
    days = JSON.parse(storage?.getItem(VISITS_KEY) ?? "[]");
    if (!Array.isArray(days)) days = [];
  } catch {
    days = [];
  }
  const cutoff = localDay(now - WEEK_MS);
  const recent = Array.from(new Set([...days, today])).filter(
    (day) => typeof day === "string" && day > cutoff
  );
  try {
    storage?.setItem(VISITS_KEY, JSON.stringify(recent));
  } catch {
    // Private mode: count this visit only
  }
  return {
    visitDays: recent.length,
    returning: days.includes(today) || recent.length > 1,
  };
};

const sessionId = () => {
  const storage = safeStorage(() => window.sessionStorage);
  let id = storage?.getItem(SESSION_KEY) ?? undefined;
  if (!id) {
    id = Math.random().toString(36).slice(2, 12);
    try {
      storage?.setItem(SESSION_KEY, id);
    } catch {
      // Fine: a new ID per page load
    }
  }
  return id;
};

interface Tracker {
  url?: string;
  session: string;
  landedAt: number;
  visitDays: number;
}

let tracker: Tracker | undefined;

/** Sends the "land" event; call once at startup */
export const initTracking = (
  url: string | undefined = import.meta.env.VITE_EVENTS_URL,
  isProduction: boolean = import.meta.env.PROD
) => {
  if (!url || !isProduction) return false;
  // Automated browsers (Lighthouse, crawlers that run scripts)
  if (navigator.webdriver) return false;
  const { visitDays, returning } = countVisitDays();
  tracker = {
    url,
    session: sessionId(),
    landedAt: performance.now(),
    visitDays,
  };
  const { source, host } = visitSource(
    document.referrer,
    window.location.hostname
  );
  track("land", [source, host, returning ? "yes" : "no"]);
  return true;
};

/** Milliseconds since the page loaded (for "time to next bus") */
export const sinceLanding = () =>
  tracker ? Math.round(performance.now() - tracker.landedAt) : 0;

const field = (value: Field) =>
  value === undefined || value === null
    ? ""
    : typeof value === "boolean"
      ? value
        ? "yes"
        : "no"
      : String(value);

/** Records one event; a no-op until initTracking has run with a URL */
export const track = (event: TrackEvent, fields: Field[] = [], value = 0) => {
  if (!tracker?.url) return;
  const body = JSON.stringify({
    e: event,
    s: tracker.session,
    p: pageType(window.location.pathname),
    f: fields.slice(0, 4).map(field),
    v: value,
    n: tracker.visitDays,
  });
  try {
    // text/plain keeps it a simple request (no CORS preflight)
    const sent = navigator.sendBeacon?.(
      tracker.url,
      new Blob([body], { type: "text/plain" })
    );
    if (!sent) {
      void fetch(tracker.url, {
        body,
        keepalive: true,
        method: "POST",
        mode: "no-cors",
      }).catch(() => undefined);
    }
  } catch {
    // Never let analytics break the page
  }
};

/** Test hook */
export const resetTracking = () => {
  tracker = undefined;
};
