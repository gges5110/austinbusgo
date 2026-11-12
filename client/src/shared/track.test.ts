import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  countVisitDays,
  initTracking,
  pageType,
  resetTracking,
  scrubSearchTerm,
  track,
  visitSource,
} from "./track";

describe("pageType", () => {
  test.each([
    ["/", "map"],
    ["/@30.2,-97.7,12z", "map"],
    ["/nearby", "nearby"],
    ["/nearby/stop/1002", "nearby"],
    ["/stop/1002", "stop"],
    ["/stop/1002/trip/abc", "trip"],
    ["/route/640/direction/0", "route"],
    ["/search/lamar", "search"],
    ["/favorites", "saved"],
    ["/recent-searches", "recent"],
    ["/dev/stops", "other"],
  ])("%s → %s", (path, type) => expect(pageType(path)).toBe(type));
});

describe("visitSource", () => {
  const own = "austinbusgo.com";
  test.each([
    ["", "direct"],
    ["not a url", "direct"],
    ["https://austinbusgo.com/stop/1", "internal"],
    ["https://www.google.com/", "search"],
    ["https://www.google.co.uk/", "search"],
    ["https://www.bing.com/search?q=640", "search"],
    ["https://l.facebook.com/", "social"],
    ["https://t.co/abc", "social"],
    ["https://www.reddit.com/r/Austin", "social"],
    ["https://capmetro.org/", "link"],
    // Not fooled by look-alike hosts
    ["https://notreddit.com/", "link"],
  ])("%s → %s", (referrer, source) =>
    expect(visitSource(referrer, own).source).toBe(source)
  );
});

describe("scrubSearchTerm", () => {
  test.each([
    ["640", "640"],
    ["  640 Bus ", "640 bus"],
    ["801 route", "801 route"],
    ["5869", "5869"],
    ["North Lamar Brentwood", "north lamar brentwood"],
    ["1234 Elm St apt 5", "# elm st apt 5"],
    ["call 5125551234", "call #"],
    ["me@example.com stop", "# stop"],
  ])("%s → %s", (term, kept) => expect(scrubSearchTerm(term)).toBe(kept));
});

describe("countVisitDays", () => {
  beforeEach(() => localStorage.clear());
  const day = (iso: string) => Date.parse(`${iso}T12:00:00Z`);

  test("first visit is not returning", () => {
    expect(countVisitDays(day("2026-11-10"))).toEqual({
      visitDays: 1,
      returning: false,
    });
  });

  test("counts distinct days within the week", () => {
    countVisitDays(day("2026-11-01"));
    countVisitDays(day("2026-11-08"));
    countVisitDays(day("2026-11-08"));
    expect(countVisitDays(day("2026-11-10"))).toEqual({
      visitDays: 2,
      returning: true,
    });
  });

  test("a second visit the same day is returning", () => {
    countVisitDays(day("2026-11-10"));
    expect(countVisitDays(day("2026-11-10")).returning).toBe(true);
  });

  test("days follow the rider's clock, not UTC", () => {
    // Tests run in UTC unless TZ is set; build local times explicitly
    const evening = new Date(2026, 10, 10, 17, 0).getTime();
    const night = new Date(2026, 10, 10, 23, 30).getTime();
    countVisitDays(evening);
    expect(countVisitDays(night)).toEqual({ visitDays: 1, returning: true });
  });

  test("survives junk in storage", () => {
    localStorage.setItem("visitDays", "{oops");
    expect(countVisitDays(day("2026-11-10")).visitDays).toBe(1);
  });
});

describe("track", () => {
  const beacon = vi.fn(() => true);
  beforeEach(() => {
    localStorage.clear();
    resetTracking();
    beacon.mockClear();
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: beacon,
    });
  });
  afterEach(() => resetTracking());

  const sent = async (index = 0) => {
    const calls = beacon.mock.calls as unknown as [string, Blob][];
    const blob = calls[index][1];
    // jsdom's Blob has no .text()
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(blob);
    });
    return JSON.parse(text);
  };

  test("sends nothing without a URL or outside production", () => {
    expect(initTracking(undefined, true)).toBe(false);
    expect(initTracking("https://e.example/e", false)).toBe(false);
    track("search", ["640"]);
    expect(beacon).not.toHaveBeenCalled();
  });

  test("lands, then sends events with the session and page", async () => {
    expect(initTracking("https://e.example/e", true)).toBe(true);
    track("save", ["stop", "1002", true, undefined]);

    expect(beacon).toHaveBeenCalledTimes(2);
    expect(beacon.mock.calls[0]).toContain("https://e.example/e");
    const land = await sent(0);
    const save = await sent(1);
    expect(land).toMatchObject({ e: "land", f: ["direct", "", "no"], n: 1 });
    expect(save).toMatchObject({ e: "save", f: ["stop", "1002", "yes", ""] });
    expect(save.s).toBe(land.s);
    expect(save.p).toBe("map");
  });
});
