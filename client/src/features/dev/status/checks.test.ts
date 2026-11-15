import { afterEach, describe, expect, test, vi } from "vitest";

import {
  eventsCheck,
  feedAgeLevel,
  realtimeCheck,
  scheduleCheck,
} from "./checks";

const NOW = 1_794_711_150;

describe("feed freshness", () => {
  test("fresh, stale after 3 min, dead after 10 min", () => {
    expect(feedAgeLevel(NOW - 60, NOW)).toBe("ok");
    expect(feedAgeLevel(NOW - 240, NOW)).toBe("warn");
    expect(feedAgeLevel(NOW - 900, NOW)).toBe("down");
  });
});

describe("realtimeCheck", () => {
  const feed = {
    name: "tripUpdates",
    ok: true,
    successes: 99,
    failures: 1,
    feedTimestamp: NOW - 20,
    entities: 1770,
    lastFetchMs: 655,
  };

  test("a fresh feed is fine, with its age and size", () => {
    const result = realtimeCheck(feed, NOW);
    expect(result.level).toBe("ok");
    expect(result.summary).toBe("CapMetro data from 20s ago, 1770 entries");
  });

  test("a failed fetch is down and says why", () => {
    const result = realtimeCheck(
      { ...feed, ok: false, error: "ConnectTimeout" },
      NOW
    );
    expect(result.level).toBe("down");
    expect(result.summary).toContain("ConnectTimeout");
  });

  test("serving the last copy after a failure is degraded, with the reason", () => {
    const result = realtimeCheck(
      { ...feed, servingStale: true, lastError: "ConnectTimeout" },
      NOW
    );
    expect(result.level).toBe("warn");
    expect(result.summary).toBe(
      "Fetch failing (ConnectTimeout); riders see the last copy, from 20s ago"
    );
  });

  test("frequent failures are degraded even when the last one worked", () => {
    expect(realtimeCheck({ ...feed, failures: 10 }, NOW).level).toBe("warn");
  });
});

describe("scheduleCheck", () => {
  const status = { now: NOW, startedAt: NOW, realtime: [] };
  // NOW is 2026-11-15
  test("warns two weeks before the schedule ends, down after", () => {
    expect(
      scheduleCheck({ ...status, feedEndDate: "2027-01-09" }, NOW).level
    ).toBe("ok");
    expect(
      scheduleCheck({ ...status, feedEndDate: "2026-11-20" }, NOW).level
    ).toBe("warn");
    expect(
      scheduleCheck({ ...status, feedEndDate: "2026-11-01" }, NOW).level
    ).toBe("down");
  });
});

describe("eventsCheck", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("a blocked request is reported as blocked in this browser", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("blocked")));
    const result = await eventsCheck("https://events.example/e");
    expect(result.level).toBe("down");
    expect(result.summary).toMatch(/blocked/);
  });

  test("off in builds that don't send events", async () => {
    expect((await eventsCheck("")).level).toBe("off");
  });
});
