import { UpcomingArrival } from "shared/api/generated/model";
import { describe, expect, test } from "vitest";

import {
  countdownLabel,
  distanceLabel,
  formatHeadsign,
  minutesUntil,
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
