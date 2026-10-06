import { renderHook } from "@testing-library/react";
import { Stop } from "shared/api/generated/model";
import { describe, expect, test } from "vitest";

import { sortByDistance, useStableAnchor } from "./useNearestStop";

const HERE = { latitude: 30.2686, longitude: -97.7425 };
// ~111 m per 0.001° of latitude
const north = (meters: number) => ({
  ...HERE,
  latitude: HERE.latitude + meters / 111195,
});

describe("useStableAnchor", () => {
  test("ignores GPS jitter under 75 m", () => {
    const { result, rerender } = renderHook(
      ({ position }) => useStableAnchor(position),
      { initialProps: { position: HERE } }
    );

    rerender({ position: north(40) });

    expect(result.current).toEqual(HERE);
  });

  test("follows the rider once they move more than 75 m", () => {
    const { result, rerender } = renderHook(
      ({ position }) => useStableAnchor(position),
      { initialProps: { position: HERE } }
    );

    rerender({ position: north(120) });

    expect(result.current).toEqual(north(120));
  });

  test("starts without a position", () => {
    const { result, rerender } = renderHook(
      ({ position }) => useStableAnchor(position),
      { initialProps: { position: undefined as typeof HERE | undefined } }
    );
    expect(result.current).toBeUndefined();

    rerender({ position: HERE });

    expect(result.current).toEqual(HERE);
  });
});

const stopAt = (stopId: string, meters: number): Stop => {
  const { latitude, longitude } = north(meters);
  return {
    stopId,
    stopName: stopId,
    stopLoc: { type: "Point", coordinates: [longitude, latitude] },
    routes: [],
  };
};

test("sortByDistance orders by straight-line distance and skips unlocated stops", () => {
  const stops = [
    stopAt("far", 300),
    { stopId: "nowhere", routes: [] },
    stopAt("near", 20),
    stopAt("middle", 150),
  ];

  const ranked = sortByDistance(stops, HERE);

  expect(ranked.map(({ stop }) => stop.stopId)).toEqual([
    "near",
    "middle",
    "far",
  ]);
  expect(ranked[0].distance).toBeCloseTo(20, 0);
});
