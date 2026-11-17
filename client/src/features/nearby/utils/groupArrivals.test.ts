import { groupArrivals } from "features/nearby/utils/groupArrivals";
import { UpcomingArrival } from "shared/api/generated/model";
import { describe, expect, test } from "vitest";

const NOW = 1_800_000_000;

const bus = (
  tripId: string,
  routeId: string,
  headsign: string,
  minutes: number,
  predictedMinutes?: number
): UpcomingArrival => ({
  tripId,
  routeId,
  headsign,
  scheduledAt: NOW + minutes * 60,
  predictedAt:
    predictedMinutes === undefined ? undefined : NOW + predictedMinutes * 60,
  status: predictedMinutes === undefined ? "scheduled" : "en_route",
});

const ids = (groups: ReturnType<typeof groupArrivals>) =>
  groups.map(({ next, later }) => [next.tripId, later.map((b) => b.tripId)]);

describe("groupArrivals", () => {
  test("one row per route and destination, in order of the next bus", () => {
    const groups = groupArrivals([
      bus("a1", "801", "North", 3),
      bus("b1", "7", "Downtown", 5),
      bus("a2", "801", "North", 12),
      bus("c1", "801", "South", 14),
      bus("a3", "801", "North", 20),
    ]);

    expect(ids(groups)).toEqual([
      ["a1", ["a2", "a3"]],
      ["b1", []],
      ["c1", []],
    ]);
  });

  test("shows at most two later buses", () => {
    const groups = groupArrivals(
      [3, 10, 20, 30].map((m) => bus(`t${m}`, "7", "Downtown", m))
    );

    expect(ids(groups)).toEqual([["t3", ["t10", "t20"]]]);
  });

  test("orders by expected time, so a late live bus comes second", () => {
    const groups = groupArrivals([
      bus("late", "7", "Downtown", 4, 15),
      bus("on-time", "7", "Downtown", 10),
      bus("other", "20", "Airport", 12),
    ]);

    expect(ids(groups)).toEqual([
      ["on-time", ["late"]],
      ["other", []],
    ]);
  });
});
