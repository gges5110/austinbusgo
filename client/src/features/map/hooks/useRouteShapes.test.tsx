import { renderHook } from "@testing-library/react";
import { LineString } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useRouteShapes } from "./useRouteShapes";

const mocks = vi.hoisted(() => ({
  useDataFromRouteLoader: vi.fn(),
}));

vi.mock("app/Router", () => ({
  useDataFromRouteLoader: mocks.useDataFromRouteLoader,
}));

vi.mock("features/route/pages/route/RouteLoader", () => ({
  routeLoader: vi.fn(),
}));

vi.mock("shared/loaders/searchParamsDataLoader", () => ({
  searchParamsDataLoader: vi.fn(),
}));

const shape = { type: "LineString", coordinates: [[0, 0]] } as LineString;

const mockLoaderData = (data: {
  route?: { shapes: LineString[] };
  searchParams?: { shapes: LineString[] };
}) => {
  mocks.useDataFromRouteLoader.mockImplementation(
    (routeId: string) => data[routeId as keyof typeof data]
  );
};

describe("useRouteShapes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoaderData({});
  });

  test("prefers searchParams shapes over route shapes", () => {
    const searchParamsShape = { ...shape };
    mockLoaderData({
      route: { shapes: [shape] },
      searchParams: { shapes: [searchParamsShape] },
    });

    const { result } = renderHook(() => useRouteShapes());

    expect(result.current.routeShapes[0]).toBe(searchParamsShape);
  });

  test("falls back to route loader shapes", () => {
    mockLoaderData({ route: { shapes: [shape] } });

    const { result } = renderHook(() => useRouteShapes());

    expect(result.current.routeShapes).toEqual([shape]);
  });

  test("returns a stable empty array when no loader has shapes", () => {
    const { result, rerender } = renderHook(() => useRouteShapes());

    expect(result.current.routeShapes).toEqual([]);
    const first = result.current.routeShapes;
    rerender();
    expect(result.current.routeShapes).toBe(first);
  });
});
