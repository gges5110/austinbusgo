import { Route, Stop } from "shared/types/interface.d";
import { describe, expect, test } from "vitest";

import {
  getOptionLabel,
  isOptionEqualToValue,
  toSearchOption,
} from "./searchPanelUtils";

const route = { routeId: "10", routeLongName: "South Congress" } as Route;
const stop = { stopId: "1001", stopName: "First & Main" } as Stop;

describe("toSearchOption", () => {
  test("resolves a route", () => {
    const option = toSearchOption(route);

    expect(option.kind).toBe("route");
    expect(option.label).toBe("10 South Congress");
    expect(option.key).toBe("route-10");
    expect(option.recent).toBe(false);
    expect(option.optionValue).toBe(route);
  });

  test("resolves a stop", () => {
    const option = toSearchOption(stop, true);

    expect(option.kind).toBe("stop");
    expect(option.label).toBe("1001 First & Main");
    expect(option.key).toBe("stop-1001");
    expect(option.recent).toBe(true);
  });

  test("resolves a search term", () => {
    const option = toSearchOption({ value: "lamar" });

    expect(option.kind).toBe("term");
    expect(option.label).toBe("lamar");
    expect(option.key).toBe("term-lamar");
  });

  test("resolves the view-all sentinel", () => {
    const option = toSearchOption({ type: "viewAll" });

    expect(option.kind).toBe("viewAll");
    expect(option.label).toBe("View all recent searches");
    expect(option.key).toBe("view-all");
  });
});

describe("getOptionLabel", () => {
  test("returns the precomputed label", () => {
    expect(getOptionLabel(toSearchOption(route))).toBe("10 South Congress");
  });
});

describe("isOptionEqualToValue", () => {
  test("options of the same entity are equal regardless of recency", () => {
    expect(
      isOptionEqualToValue(toSearchOption(route), toSearchOption(route, true))
    ).toBe(true);
  });

  test("options of different kinds or ids are not equal", () => {
    expect(
      isOptionEqualToValue(toSearchOption(route), toSearchOption(stop))
    ).toBe(false);
    expect(
      isOptionEqualToValue(
        toSearchOption(route),
        toSearchOption({ ...route, routeId: "20" } as Route)
      )
    ).toBe(false);
  });
});
