import { apiBase, backendOrigin } from "config/config";
import { RealtimeFeedStatus, Status } from "shared/api/generated/model";

export type Level = "ok" | "warn" | "down" | "off";

export interface CheckResult {
  level: Level;
  /** One line: what's going on */
  summary: string;
  /** Label → value rows */
  details: [string, string][];
}

// CapMetro's feeds are normally under a minute or so old; older than this
// means they stopped updating
const FEED_STALE_SECONDS = 180;
const FEED_DEAD_SECONDS = 600;
// Slower than this feels broken to riders
const SLOW_MS = 2000;
// Warn this long before the schedule runs out
const SCHEDULE_WARN_DAYS = 14;

const now = () => Date.now() / 1000;

export const ago = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  if (s < 90) return `${s}s ago`;
  if (s < 90 * 60) return `${Math.round(s / 60)} min ago`;
  if (s < 36 * 3600) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} days ago`;
};

const worst = (...levels: Level[]): Level =>
  (["down", "warn", "ok", "off"] as Level[]).find((level) =>
    levels.includes(level)
  ) ?? "ok";

/** Times a fetch; throws on network errors and non-2xx */
const timed = async (url: string, init?: RequestInit) => {
  const started = performance.now();
  const response = await fetch(url, { cache: "no-store", ...init });
  const ms = Math.round(performance.now() - started);
  if (!response.ok && response.type !== "opaque") {
    throw new Error(`HTTP ${response.status}`);
  }
  return { response, ms };
};

const speed = (ms: number): Level => (ms > SLOW_MS ? "warn" : "ok");

/** Age of a feed's own timestamp, as a level */
export const feedAgeLevel = (timestamp?: number | null, at = now()): Level => {
  if (!timestamp) return "warn";
  const age = at - timestamp;
  return age > FEED_DEAD_SECONDS
    ? "down"
    : age > FEED_STALE_SECONDS
      ? "warn"
      : "ok";
};

export const fetchStatus = async () => {
  const { response, ms } = await timed(`${backendOrigin}/api/rt/status`);
  return { status: (await response.json()) as Status, ms };
};

export const backendCheck = (status: Status, ms: number): CheckResult => {
  const uptime = status.now - status.startedAt;
  const coldStart = uptime < 60;
  return {
    level: speed(ms),
    summary: `Answered in ${ms} ms${coldStart ? " (just woke up: cold start)" : ""}`,
    details: [
      ["Worker started", ago(uptime)],
      ["Revision", status.revision ?? "local"],
    ],
  };
};

const FEED_NAMES: Record<string, string> = {
  tripUpdates: "arrival predictions",
  vehiclePositions: "bus locations",
};

/** A CapMetro feed as the backend sees it */
export const realtimeCheck = (
  feed: RealtimeFeedStatus,
  at: number
): CheckResult => {
  const age = feed.feedTimestamp ? at - feed.feedTimestamp : undefined;
  const ageLevel = feed.ok ? feedAgeLevel(feed.feedTimestamp, at) : "down";
  const failureRate =
    feed.successes + feed.failures > 0
      ? feed.failures / (feed.successes + feed.failures)
      : 0;
  return {
    level: worst(ageLevel, failureRate > 0.05 ? "warn" : "ok"),
    summary: !feed.ok
      ? `Can't fetch ${FEED_NAMES[feed.name] ?? feed.name}: ${feed.error}`
      : age !== undefined
        ? `CapMetro data from ${ago(age)}, ${feed.entities ?? 0} entries`
        : "Fetched, but the feed has no timestamp",
    details: [
      [
        "Download time",
        feed.lastFetchMs != null ? `${feed.lastFetchMs} ms` : "–",
      ],
      [
        "Failed fetches (this worker)",
        `${feed.failures} of ${feed.successes + feed.failures}`,
      ],
      [
        "Last failure",
        feed.lastFailureAt
          ? `${ago(at - feed.lastFailureAt)}: ${feed.lastError ?? ""}`
          : "none",
      ],
    ],
  };
};

export const scheduleCheck = (status: Status, at = now()): CheckResult => {
  const end = status.feedEndDate
    ? new Date(`${status.feedEndDate}T23:59:59-06:00`).getTime() / 1000
    : undefined;
  const daysLeft =
    end !== undefined ? Math.floor((end - at) / 86400) : undefined;
  return {
    level:
      daysLeft === undefined
        ? "warn"
        : daysLeft < 0
          ? "down"
          : daysLeft < SCHEDULE_WARN_DAYS
            ? "warn"
            : "ok",
    summary:
      daysLeft === undefined
        ? "No end date in the feed"
        : daysLeft < 0
          ? `Schedule ended on ${status.feedEndDate}: load a new feed`
          : `Valid until ${status.feedEndDate} (${daysLeft} days left)`,
    details: [
      ["Feed version", status.feedVersion ?? "–"],
      ["Valid from", status.feedStartDate ?? "–"],
      [
        "Database built",
        status.databaseBuiltAt ? ago(at - status.databaseBuiltAt) : "–",
      ],
    ],
  };
};

export const edgeCacheCheck = async (): Promise<CheckResult> => {
  const { response, ms } = await timed(`${apiBase}/api/feed-info`);
  const cache = response.headers.get("X-Edge-Cache") ?? "none";
  return {
    level: speed(ms),
    summary: `Answered in ${ms} ms (cache ${cache})`,
    details: [["Endpoint", `${apiBase || "same origin"}/api/feed-info`]],
  };
};

export const proxyCheck = async (): Promise<CheckResult> => {
  const started = performance.now();
  // Lazy: protobufjs stays out of the main bundle
  const { fetchFeedHeader } = await import("shared/services/gtfsRtFrontend");
  const feed = await fetchFeedHeader("/vehicle-positions");
  const ms = Math.round(performance.now() - started);
  const age = feed.timestamp ? now() - feed.timestamp : undefined;
  return {
    level: worst(feedAgeLevel(feed.timestamp), speed(ms)),
    summary:
      age !== undefined
        ? `Bus locations from ${ago(age)}, ${feed.entities} entries, ${ms} ms`
        : `Answered in ${ms} ms, but the feed has no timestamp`,
    details: [["Used by", "the /dev pages that read the feed in the browser"]],
  };
};

export const eventsCheck = async (
  url: string | undefined = import.meta.env.VITE_EVENTS_URL
): Promise<CheckResult> => {
  if (!url) {
    return {
      level: "off",
      summary: "Not sent from this build (only production sends events)",
      details: [],
    };
  }
  const health = url.replace(/\/e$/, "/health");
  try {
    const { ms } = await timed(health);
    return {
      level: speed(ms),
      summary: `Reachable from this browser, ${ms} ms`,
      details: [["Endpoint", health]],
    };
  } catch {
    return {
      level: "down",
      summary:
        "Unreachable from this browser: likely blocked by tracking protection or an ad blocker",
      details: [["Endpoint", health]],
    };
  }
};

export const webAnalyticsCheck = async (
  token: string | undefined = import.meta.env.VITE_CF_ANALYTICS_TOKEN
): Promise<CheckResult> => {
  if (!token) {
    return {
      level: "off",
      summary: "Not loaded in this build (only production counts visits)",
      details: [],
    };
  }
  try {
    await timed("https://static.cloudflareinsights.com/beacon.min.js", {
      mode: "no-cors",
    });
    return {
      level: "ok",
      summary: "Beacon script reachable from this browser",
      details: [],
    };
  } catch {
    return {
      level: "warn",
      summary:
        "Beacon blocked in this browser, so this visit isn't counted (common with blockers)",
      details: [],
    };
  }
};
