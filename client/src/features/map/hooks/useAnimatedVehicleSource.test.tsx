import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useAnimatedVehicleSource } from "./useAnimatedVehicleSource";

const mocks = vi.hoisted(() => {
  const setData = vi.fn();
  const rawMap = {
    getSource: vi.fn(() => ({ setData })),
  };
  const map = { getMap: () => rawMap };
  return { setData, rawMap, map, useMap: vi.fn(() => ({ mapId: map })) };
});

vi.mock("react-map-gl/mapbox", () => ({
  useMap: mocks.useMap,
}));

const collection = (
  vehicles: Array<{ id: string; lon: number; lat: number; bearing: number }>
): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
  type: "FeatureCollection",
  features: vehicles.map((v) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [v.lon, v.lat] },
    properties: { vehicleId: v.id, bearing: v.bearing },
  })),
});

describe("useAnimatedVehicleSource", () => {
  let rafCallbacks: FrameRequestCallback[];
  let now: number;

  beforeEach(() => {
    vi.clearAllMocks();
    rafCallbacks = [];
    now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const runFrame = (advanceMs: number) => {
    now += advanceMs;
    const pending = rafCallbacks.splice(0);
    for (const cb of pending) cb(now);
  };

  test("new vehicles appear at their reported position immediately", () => {
    renderHook(() =>
      useAnimatedVehicleSource(
        "vehicles-source",
        collection([{ id: "v1", lon: -97.7, lat: 30.2, bearing: 90 }])
      )
    );

    runFrame(16);

    const written = mocks.setData.mock.calls.at(-1)![0];
    expect(written.features[0].geometry.coordinates).toEqual([-97.7, 30.2]);
  });

  test("moved vehicles glide between old and new positions", () => {
    const { rerender } = renderHook(
      ({ data }) => useAnimatedVehicleSource("vehicles-source", data),
      {
        initialProps: {
          data: collection([{ id: "v1", lon: 0, lat: 0, bearing: 0 }]),
        },
      }
    );
    runFrame(5000); // settle the first appearance

    rerender({ data: collection([{ id: "v1", lon: 1, lat: 1, bearing: 0 }]) });
    runFrame(16); // partway through the animation

    const written = mocks.setData.mock.calls.at(-1)![0];
    const [lon, lat] = written.features[0].geometry.coordinates;
    expect(lon).toBeGreaterThan(0);
    expect(lon).toBeLessThan(1);
    expect(lat).toBeGreaterThan(0);
    expect(lat).toBeLessThan(1);

    runFrame(5000); // animation complete
    const settled = mocks.setData.mock.calls.at(-1)![0];
    expect(settled.features[0].geometry.coordinates).toEqual([1, 1]);
  });

  test("bearing rotates the short way around", () => {
    const { rerender } = renderHook(
      ({ data }) => useAnimatedVehicleSource("vehicles-source", data),
      {
        initialProps: {
          data: collection([{ id: "v1", lon: 0, lat: 0, bearing: 350 }]),
        },
      }
    );
    runFrame(5000);

    rerender({
      data: collection([{ id: "v1", lon: 0, lat: 0, bearing: 10 }]),
    });
    runFrame(16);

    const written = mocks.setData.mock.calls.at(-1)![0];
    const bearing = written.features[0].properties.bearing;
    // 350 -> 10 must pass through 360, never dip toward 180
    expect(bearing > 350 || bearing < 10).toBe(true);
  });

  test("vanished vehicles are dropped from the written data", () => {
    const { rerender } = renderHook(
      ({ data }) => useAnimatedVehicleSource("vehicles-source", data),
      {
        initialProps: {
          data: collection([
            { id: "v1", lon: 0, lat: 0, bearing: 0 },
            { id: "v2", lon: 1, lat: 1, bearing: 0 },
          ]),
        },
      }
    );
    runFrame(5000);

    rerender({ data: collection([{ id: "v1", lon: 0, lat: 0, bearing: 0 }]) });
    runFrame(16);

    const written = mocks.setData.mock.calls.at(-1)![0];
    expect(written.features).toHaveLength(1);
    expect(written.features[0].properties.vehicleId).toBe("v1");
  });
});
