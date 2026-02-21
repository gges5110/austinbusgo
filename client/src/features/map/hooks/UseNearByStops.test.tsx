import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, test, vi, beforeEach } from "vitest";

import { stopsZoomThreshold, useNearByStops } from "./UseNearByStops";

const mocks = vi.hoisted(() => {
  return {
    mockUseNearByStopsQuery: vi.fn(),
    mockRemoveQueries: vi.fn(),
    mockIsFetching: vi.fn(),
  };
});

vi.mock("shared/api/schemas/NearByStops.generated", () => ({
  useNearByStopsQuery: mocks.mockUseNearByStopsQuery,
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = (await vi.importActual("@tanstack/react-query")) as object;
  return {
    ...actual,
    useQueryClient: () => ({
      removeQueries: mocks.mockRemoveQueries,
      isFetching: mocks.mockIsFetching,
    }),
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
    mocks.mockIsFetching.mockReturnValue(0);
  });

  test("returns empty nearByStops when no viewState provided", () => {
    const { result } = renderHook(() => useNearByStops(), {
      wrapper: createWrapper(),
    });

    expect(result.current.nearByStops).toEqual([]);
    expect(mocks.mockUseNearByStopsQuery).toHaveBeenCalledWith(
      { lat: 0, lon: 0 },
      expect.objectContaining({ enabled: false })
    );
  });

  test("returns empty nearByStops when zoom is below threshold", () => {
    const viewState = {
      latitude: 30.2672,
      longitude: -97.7431,
      zoom: stopsZoomThreshold - 1,
    };

    const { result } = renderHook(() => useNearByStops(viewState), {
      wrapper: createWrapper(),
    });

    expect(result.current.nearByStops).toEqual([]);
    expect(mocks.mockUseNearByStopsQuery).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: false })
    );
  });

  test("fetches and returns nearByStops when zoom meets threshold", () => {
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

    const viewState = {
      latitude: 30.2672,
      longitude: -97.7431,
      zoom: stopsZoomThreshold,
    };

    const { result } = renderHook(() => useNearByStops(viewState), {
      wrapper: createWrapper(),
    });

    expect(result.current.nearByStops).toEqual(mockStops);
    expect(mocks.mockUseNearByStopsQuery).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: true })
    );
  });

  test("rounds coordinates to 3 decimal places", () => {
    const viewState = {
      latitude: 30.26729999,
      longitude: -97.74315555,
      zoom: stopsZoomThreshold,
    };

    renderHook(() => useNearByStops(viewState), {
      wrapper: createWrapper(),
    });

    expect(mocks.mockUseNearByStopsQuery).toHaveBeenCalledWith(
      { lat: 30.267, lon: -97.743 },
      expect.any(Object)
    );
  });

  test("fetchNearByStops calls removeQueries", () => {
    const { result } = renderHook(() => useNearByStops(), {
      wrapper: createWrapper(),
    });

    result.current.fetchNearByStops();

    expect(mocks.mockRemoveQueries).toHaveBeenCalledWith({
      queryKey: ["NearByStops"],
    });
  });

  test("isLoading reflects isFetching state", () => {
    mocks.mockUseNearByStopsQuery.mockReturnValue({
      data: undefined,
      isFetching: true,
    });

    const viewState = {
      latitude: 30.2672,
      longitude: -97.7431,
      zoom: stopsZoomThreshold,
    };

    const { result } = renderHook(() => useNearByStops(viewState), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  test("returns empty nearByStops when query has no data", () => {
    mocks.mockUseNearByStopsQuery.mockReturnValue({
      data: undefined,
      isFetching: false,
    });

    const viewState = {
      latitude: 30.2672,
      longitude: -97.7431,
      zoom: stopsZoomThreshold,
    };

    const { result } = renderHook(() => useNearByStops(viewState), {
      wrapper: createWrapper(),
    });

    expect(result.current.nearByStops).toEqual([]);
  });
});
