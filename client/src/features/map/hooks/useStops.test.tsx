import { renderHook } from "@testing-library/react";
import { Stop } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useStops } from "./useStops";

const mocks = vi.hoisted(() => ({
  useDataFromRouteLoader: vi.fn(),
  useCurrentStop: vi.fn(),
  useAllStops: vi.fn(),
}));

vi.mock("app/Router", () => ({
  useDataFromRouteLoader: mocks.useDataFromRouteLoader,
}));

vi.mock("features/route/pages/route/RouteLoader", () => ({
  routeLoader: vi.fn(),
}));

vi.mock("features/search/pages/search/SearchLoader", () => ({
  searchLoader: vi.fn(),
}));

vi.mock("features/search/pages/search/SearchResultsMenu", () => ({
  isResponse: (data: unknown) => data instanceof Response,
}));

vi.mock("shared/loaders/searchParamsDataLoader", () => ({
  searchParamsDataLoader: vi.fn(),
}));

vi.mock("shared/hooks/UseCurrentStop", () => ({
  useCurrentStop: mocks.useCurrentStop,
}));

vi.mock("features/map/hooks/useAllStops", () => ({
  useAllStops: mocks.useAllStops,
}));

const makeStop = (stopId: string, stopName = `Stop ${stopId}`): Stop =>
  ({ stopId, stopName }) as Stop;

const mockLoaderData = (data: {
  route?: { stops: Stop[] };
  search?: { search: { stops: Stop[] } };
  searchParams?: { stops: Stop[] };
}) => {
  mocks.useDataFromRouteLoader.mockImplementation(
    (routeId: string) => data[routeId as keyof typeof data]
  );
};

describe("useStops", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoaderData({});
    mocks.useCurrentStop.mockReturnValue({ currentStop: undefined });
    mocks.useAllStops.mockReturnValue({ allStops: [] });
  });

  test("returns all stops when there is no route/search context", () => {
    const nearby = [makeStop("n1"), makeStop("n2")];
    mocks.useAllStops.mockReturnValue({ allStops: nearby });

    const { result } = renderHook(() => useStops());

    expect(result.current.stops).toEqual(nearby);
    expect(result.current.contextStops).toEqual([]);
    expect(mocks.useAllStops).toHaveBeenCalledWith(true);
  });

  test("disables the all-stops layer when route stops are present", () => {
    const routeStops = [makeStop("r1")];
    mockLoaderData({ route: { stops: routeStops } });

    const { result } = renderHook(() => useStops());

    expect(mocks.useAllStops).toHaveBeenCalledWith(false);
    expect(result.current.contextStops).toEqual(routeStops);
    expect(result.current.stops).toEqual(routeStops);
  });

  test("includes search stops and the current stop in context stops", () => {
    const searchStops = [makeStop("s1")];
    const currentStop = makeStop("c1");
    mockLoaderData({ search: { search: { stops: searchStops } } });
    mocks.useCurrentStop.mockReturnValue({ currentStop });

    const { result } = renderHook(() => useStops());

    expect(result.current.contextStops).toEqual([...searchStops, currentStop]);
    expect(mocks.useAllStops).toHaveBeenCalledWith(false);
  });

  test("deduplicates stops by stopId, later source wins", () => {
    const routeStop = makeStop("dup", "From route");
    const nearbyDuplicate = makeStop("dup", "From nearby");
    const currentStop = makeStop("dup", "Current");
    mockLoaderData({ route: { stops: [routeStop] } });
    mocks.useCurrentStop.mockReturnValue({ currentStop });
    mocks.useAllStops.mockReturnValue({ allStops: [nearbyDuplicate] });

    const { result } = renderHook(() => useStops());

    expect(result.current.stops).toHaveLength(1);
    expect(result.current.stops[0].stopName).toBe("From nearby");
    expect(result.current.contextStops).toHaveLength(1);
    expect(result.current.contextStops[0].stopName).toBe("Current");
  });

  test("returns stable references when inputs do not change", () => {
    const routeStops = [makeStop("r1")];
    mockLoaderData({ route: { stops: routeStops } });

    const { result, rerender } = renderHook(() => useStops());
    const first = result.current;
    rerender();

    expect(result.current.stops).toBe(first.stops);
    expect(result.current.contextStops).toBe(first.contextStops);
  });
});
