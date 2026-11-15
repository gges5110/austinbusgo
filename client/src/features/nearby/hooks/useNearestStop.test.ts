import { renderHook } from "@testing-library/react";
import { Stop } from "shared/api/generated/model";
import { describe, expect, test, vi } from "vitest";

import {
  sortByDistance,
  useNearestStop,
  useStableAnchor,
} from "./useNearestStop";

const nearByStops = vi.hoisted(() => vi.fn());

vi.mock("shared/api/generated/api", () => ({
  useNearByStops: (params: { max_lat: number; min_lat: number }) =>
    nearByStops(params),
}));

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

describe("useNearestStop", () => {
  // Half the box's height, in meters: the search radius
  const radiusOf = ({
    max_lat,
    min_lat,
  }: {
    max_lat: number;
    min_lat: number;
  }) => Math.round(((max_lat - min_lat) / 2) * 111195);

  test("nothing within a 5-minute walk: searches a 20-minute walk", () => {
    nearByStops.mockImplementation((params) => ({
      data: radiusOf(params) > 1000 ? [stopAt("far", 900)] : [],
      isLoading: false,
      isError: false,
    }));

    const { result } = renderHook(() => useNearestStop(HERE));

    expect(result.current.nearest?.stop.stopId).toBe("far");
    expect(nearByStops.mock.calls.map(([params]) => radiusOf(params))).toEqual(
      expect.arrayContaining([400, 1500])
    );
  });

  test("a stop within a 5-minute walk: no wider search", () => {
    nearByStops.mockReset();
    nearByStops.mockImplementation(() => ({
      data: [stopAt("close", 100)],
      isLoading: false,
      isError: false,
    }));

    const { result } = renderHook(() => useNearestStop(HERE));

    expect(result.current.nearest?.stop.stopId).toBe("close");
    expect(
      nearByStops.mock.calls.every(([params]) => radiusOf(params) === 400)
    ).toBe(true);
  });

  test("still searching while widening, so no empty state flashes", () => {
    nearByStops.mockReset();
    nearByStops.mockImplementation((params) => ({
      data: radiusOf(params) > 1000 ? undefined : [],
      isLoading: radiusOf(params) > 1000,
      isError: false,
    }));

    const { result } = renderHook(() => useNearestStop(HERE));

    expect(result.current.nearest).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });
});
