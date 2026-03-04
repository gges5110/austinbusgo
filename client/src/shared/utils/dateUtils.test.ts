import dayjs from "dayjs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { parseArrivalTime } from "./dateUtils";

describe("parseArrivalTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns same day for a normal future time", () => {
    vi.setSystemTime(new Date("2026-03-03T14:00:00"));

    const result = parseArrivalTime("15:30:00");

    expect(result.isSame(dayjs("2026-03-03T15:30:00"), "minute")).toBe(true);
  });

  test("returns same day for a recent past time within 12 hours", () => {
    vi.setSystemTime(new Date("2026-03-03T14:00:00"));

    const result = parseArrivalTime("10:00:00");

    expect(result.isSame(dayjs("2026-03-03T10:00:00"), "minute")).toBe(true);
  });

  test("adds one day for after-midnight time when current time is late evening", () => {
    vi.setSystemTime(new Date("2026-03-03T23:50:00"));

    const result = parseArrivalTime("00:05:00");

    expect(result.isSame(dayjs("2026-03-04T00:05:00"), "minute")).toBe(true);
  });

  test("adds one day for a time that is more than 12 hours in the past", () => {
    vi.setSystemTime(new Date("2026-03-03T23:00:00"));

    // 23:00 - 00:02 = 22h58m in the past as same-day, so it gets +1 day
    const result = parseArrivalTime("00:02:00");

    expect(result.isSame(dayjs("2026-03-04T00:02:00"), "minute")).toBe(true);
  });

  test("does not add a day for a same-day time exactly 12 hours ago", () => {
    vi.setSystemTime(new Date("2026-03-03T23:00:00"));

    // 11:00 is exactly 12h before 23:00 — diff(hour) === 12, not > 12
    const result = parseArrivalTime("11:00:00");

    expect(result.isSame(dayjs("2026-03-03T11:00:00"), "minute")).toBe(true);
  });
});
