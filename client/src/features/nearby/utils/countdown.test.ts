import dayjs from "dayjs";
import { UpcomingArrival } from "shared/api/generated/model";
import { describe, expect, test } from "vitest";

import {
  countdownLabel,
  distanceLabel,
  formatHeadsign,
  formatNextBusTime,
  minutesUntil,
  TRANSIT_TIME_ZONE,
} from "./countdown";

const NOW = 1_800_000_000;

const arrival = (
  overrides: Partial<UpcomingArrival> = {}
): UpcomingArrival => ({
  tripId: "t1",
  routeId: "801",
  scheduledAt: NOW + 10 * 60,
  status: "scheduled",
  ...overrides,
});

describe("countdownLabel", () => {
  test("uses the live prediction, not the schedule", () => {
    // Regression: the old stop page counted down to the scheduled time
    const late = arrival({
      predictedAt: NOW + 16 * 60,
      status: "en_route",
    });

    expect(countdownLabel(late, NOW)).toBe("16 min");
  });

  test("falls back to the schedule without a prediction", () => {
    expect(countdownLabel(arrival(), NOW)).toBe("10 min");
  });

  test("says Arriving instead of 0 or negative minutes", () => {
    const overdue = arrival({ predictedAt: NOW - 90, status: "en_route" });

    expect(countdownLabel(overdue, NOW)).toBe("Arriving");
  });

  test("says Arriving whenever the server says so", () => {
    const arriving = arrival({ predictedAt: NOW + 100, status: "arriving" });

    expect(countdownLabel(arriving, NOW)).toBe("Arriving");
  });
});

test("minutesUntil rounds down and never goes negative", () => {
  expect(minutesUntil(NOW + 119, NOW)).toBe(1);
  expect(minutesUntil(NOW - 600, NOW)).toBe(0);
});

describe("distanceLabel", () => {
  test.each([
    [0, "Next stop"],
    [1, "1 stop away"],
    [4, "4 stops away"],
  ])("%i stops away → %s", (stopsAway, label) => {
    expect(distanceLabel(arrival({ stopsAway }))).toBe(label);
  });

  test("live prediction without a vehicle", () => {
    expect(distanceLabel(arrival({ predictedAt: NOW + 60 }))).toBe("Live");
  });

  test("schedule only", () => {
    expect(distanceLabel(arrival())).toBe("Scheduled");
  });
});

describe("formatHeadsign", () => {
  test.each([
    ["801 Tech Ridge Park & Ride NB", "801", "Tech Ridge Park & Ride NB"],
    ["801-Tech Ridge", "801", "Tech Ridge"],
    ["Downtown", "10", "Downtown"],
  ])("%s", (headsign, routeId, expected) => {
    expect(formatHeadsign(headsign, routeId)).toBe(expected);
  });

  test("missing headsign", () => {
    expect(formatHeadsign(null, "1")).toBe("");
  });
});

describe("formatNextBusTime", () => {
  // Austin wall-clock times, whatever the machine's time zone
  const at = (iso: string) => dayjs.tz(iso, TRANSIT_TIME_ZONE).unix();
  const now = at("2026-11-10T23:20:00"); // a Tuesday night

  test.each([
    ["later today", "2026-11-10T23:50:00", "at 11:50 PM"],
    ["tomorrow", "2026-11-11T05:42:00", "tomorrow at 5:42 AM"],
    ["later this week", "2026-11-12T10:22:00", "Thursday at 10:22 AM"],
    ["a week or more out", "2026-11-19T10:22:00", "Thu, Nov 19 at 10:22 AM"],
  ])("%s", (_, when, expected) => {
    expect(formatNextBusTime(at(when), now)).toBe(expected);
  });
});

// CI runs in UTC, where 11:30 PM Austin is already the next day
test("counts days in Austin time, not the device's", () => {
  const now = dayjs.tz("2026-11-10T23:30:00", TRANSIT_TIME_ZONE).unix();
  const bus = dayjs.tz("2026-11-11T05:42:00", TRANSIT_TIME_ZONE).unix();

  expect(formatNextBusTime(bus, now)).toBe("tomorrow at 5:42 AM");
});
