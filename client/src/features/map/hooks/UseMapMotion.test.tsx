import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import React from "react";

import { mapsFlyToCoordinateAtom } from "shared/state/atoms";
import { LineString, Stop } from "shared/types/interface.d";
import { vi } from "vitest";

import { useMapMotion } from "./UseMapMotion";

// --- mocks ---

const mockFlyTo = vi.fn();
const mockFitBounds = vi.fn();

const mocks = vi.hoisted(() => ({
  mockUseMap: vi.fn(),
}));

vi.mock("react-map-gl/mapbox", () => ({
  useMap: mocks.mockUseMap,
}));

// --- helpers ---

const makeStop = (lng: number, lat: number): Stop =>
  ({
    stopId: "s1",
    stopLoc: { coordinates: [lng, lat], type: "Point" },
  }) as unknown as Stop;

const makeLineString = (coords: Array<[number, number]>): LineString =>
  ({
    coordinates: coords,
    type: "LineString",
  }) as unknown as LineString;

const makeWrapper = (store: ReturnType<typeof createStore>) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  Wrapper.displayName = "Wrapper";
  return Wrapper;
};

// --- tests ---

describe("useMapMotion", () => {
  beforeEach(() => {
    mocks.mockUseMap.mockReturnValue({
      mapId: { flyTo: mockFlyTo, fitBounds: mockFitBounds },
    });
    vi.clearAllMocks();
  });

  describe("mapsFlyToCoordinate atom", () => {
    it("calls flyTo when mapsFlyToCoordinate is set", () => {
      const store = createStore();
      const { rerender } = renderHook(() => useMapMotion([], []), {
        wrapper: makeWrapper(store),
      });

      act(() => {
        store.set(mapsFlyToCoordinateAtom, [-97.7, 30.3]);
      });
      rerender();

      expect(mockFlyTo).toHaveBeenCalledWith(
        expect.objectContaining({ center: [-97.7, 30.3] })
      );
    });

    it("does not call flyTo when mapsFlyToCoordinate is undefined", () => {
      const store = createStore();
      renderHook(() => useMapMotion([], []), { wrapper: makeWrapper(store) });

      expect(mockFlyTo).not.toHaveBeenCalled();
    });
  });

  describe("flyToRoute", () => {
    it("calls fitBounds with correct bounds when routeShapes are provided", () => {
      const store = createStore();
      const shapes = [
        makeLineString([
          [-97.8, 30.2],
          [-97.6, 30.4],
        ]),
      ];
      renderHook(() => useMapMotion([], shapes), {
        wrapper: makeWrapper(store),
      });

      expect(mockFitBounds).toHaveBeenCalledWith(
        [
          [-97.8, 30.2],
          [-97.6, 30.4],
        ],
        expect.any(Object)
      );
    });

    it("does not call fitBounds when routeShapes is empty", () => {
      const store = createStore();
      renderHook(() => useMapMotion([], []), { wrapper: makeWrapper(store) });

      expect(mockFitBounds).not.toHaveBeenCalled();
    });
  });

  describe("flyToStops", () => {
    it("calls fitBounds with correct bounds from stops when no routeShapes", () => {
      const store = createStore();
      const stops = [makeStop(-97.8, 30.2), makeStop(-97.6, 30.4)];
      renderHook(() => useMapMotion(stops, []), {
        wrapper: makeWrapper(store),
      });

      expect(mockFitBounds).toHaveBeenCalledWith(
        [
          [-97.8, 30.2],
          [-97.6, 30.4],
        ],
        expect.any(Object)
      );
    });

    it("does not call fitBounds when stops array is empty", () => {
      const store = createStore();
      renderHook(() => useMapMotion([], []), { wrapper: makeWrapper(store) });

      expect(mockFitBounds).not.toHaveBeenCalled();
    });

    it("skips stops without coordinates", () => {
      const store = createStore();
      const noCoords = { stopId: "s2" } as unknown as Stop;
      const stops = [makeStop(-97.8, 30.2), noCoords, makeStop(-97.6, 30.4)];
      renderHook(() => useMapMotion(stops, []), {
        wrapper: makeWrapper(store),
      });

      expect(mockFitBounds).toHaveBeenCalledWith(
        [
          [-97.8, 30.2],
          [-97.6, 30.4],
        ],
        expect.any(Object)
      );
    });

    it("limits zoom when fitting to stops", () => {
      const store = createStore();
      renderHook(() => useMapMotion([makeStop(-97.8, 30.2)], []), {
        wrapper: makeWrapper(store),
      });

      expect(mockFitBounds).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ maxZoom: 16 })
      );
    });

    it("prefers route shapes over stops when both are provided", () => {
      const store = createStore();
      const shapes = [
        makeLineString([
          [-97.9, 30.1],
          [-97.5, 30.5],
        ]),
      ];
      renderHook(() => useMapMotion([makeStop(-97.8, 30.2)], shapes), {
        wrapper: makeWrapper(store),
      });

      expect(mockFitBounds).toHaveBeenCalledTimes(1);
      expect(mockFitBounds).toHaveBeenCalledWith(
        [
          [-97.9, 30.1],
          [-97.5, 30.5],
        ],
        expect.any(Object)
      );
    });
  });

  describe("when map is not ready", () => {
    it("does not throw when map is undefined", () => {
      mocks.mockUseMap.mockReturnValue({ mapId: undefined });
      const store = createStore();
      expect(() =>
        renderHook(() => useMapMotion([makeStop(-97.75, 30.25)], []), {
          wrapper: makeWrapper(store),
        })
      ).not.toThrow();
    });
  });
});
