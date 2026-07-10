import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, test, vi, beforeEach } from "vitest";

import { useNearByStops } from "./UseNearByStops";

const mocks = vi.hoisted(() => {
  return {
    mockUseNearByStopsQuery: vi.fn(),
  };
});

vi.mock("shared/api/schemas/NearByStops.generated", () => ({
  useNearByStopsQuery: mocks.mockUseNearByStopsQuery,
}));

vi.mock("react-map-gl/mapbox", () => ({
  useMap: vi.fn(() => ({
    mapId: {
      getBounds: vi.fn(() => ({
        getSouth: () => 30.2,
        getWest: () => -97.8,
        getNorth: () => 30.3,
        getEast: () => -97.7,
      })),
    },
  })),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = (await vi.importActual("@tanstack/react-query")) as object;
  return {
    ...actual,
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
};

describe("useNearByStops", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUseNearByStopsQuery.mockReturnValue({
      data: undefined,
      isFetching: false,
    });
  });

  test("returns empty nearByStops and disables the query when not enabled", () => {
    const { result } = renderHook(() => useNearByStops(false), {
      wrapper: createWrapper(),
    });

    expect(result.current.nearByStops).toEqual([]);
    expect(mocks.mockUseNearByStopsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        minLat: 30.2,
        minLon: -97.8,
        maxLat: 30.3,
        maxLon: -97.7,
        limit: 300,
      }),
      { enabled: false, keepPreviousData: true }
    );
  });

  test("fetches and returns nearByStops when enabled", () => {
    const mockStops = [
      {
        stopId: "1001",
        stopCode: "1001",
        stopName: "Test Stop",
        stopLoc: { type: "Point", coordinates: [-97.7431, 30.2672] },
      },
    ];
    mocks.mockUseNearByStopsQuery.mockReturnValue({
      data: { nearByStops: mockStops },
      isFetching: false,
    });

    const { result } = renderHook(() => useNearByStops(true), {
      wrapper: createWrapper(),
    });

    expect(result.current.nearByStops).toEqual(mockStops);
    expect(mocks.mockUseNearByStopsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        minLat: 30.2,
        minLon: -97.8,
        maxLat: 30.3,
        maxLon: -97.7,
        limit: 300,
      }),
      expect.objectContaining({ enabled: true, keepPreviousData: true })
    );
  });

  test("uses bbox from map bounds as query params", () => {
    renderHook(() => useNearByStops(true), {
      wrapper: createWrapper(),
    });

    expect(mocks.mockUseNearByStopsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        minLat: 30.2,
        minLon: -97.8,
        maxLat: 30.3,
        maxLon: -97.7,
      }),
      expect.any(Object)
    );
  });

  test("isLoading reflects isFetching state", () => {
    mocks.mockUseNearByStopsQuery.mockReturnValue({
      data: undefined,
      isFetching: true,
    });

    const { result } = renderHook(() => useNearByStops(true), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  test("returns empty nearByStops when query has no data", () => {
    mocks.mockUseNearByStopsQuery.mockReturnValue({
      data: undefined,
      isFetching: false,
    });

    const { result } = renderHook(() => useNearByStops(true), {
      wrapper: createWrapper(),
    });

    expect(result.current.nearByStops).toEqual([]);
  });
});
