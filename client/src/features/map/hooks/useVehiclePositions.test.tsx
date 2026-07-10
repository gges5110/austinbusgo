import { renderHook } from "@testing-library/react";
import { Route, VehiclePosition } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useVehiclePositions } from "./useVehiclePositions";

const mocks = vi.hoisted(() => ({
  useDataFromRouteLoader: vi.fn(),
  useVehiclePositionsQuery: vi.fn(),
  useCurrentRoute: vi.fn(),
  useLocation: vi.fn(),
}));

vi.mock("app/Router", () => ({
  useDataFromRouteLoader: mocks.useDataFromRouteLoader,
}));

vi.mock("shared/loaders/searchParamsDataLoader", () => ({
  searchParamsDataLoader: vi.fn(),
}));

vi.mock("shared/api/schemas/VehiclePositions.generated", () => ({
  useVehiclePositionsQuery: mocks.useVehiclePositionsQuery,
}));

vi.mock("shared/hooks/UseCurrentRoute", () => ({
  useCurrentRoute: mocks.useCurrentRoute,
}));

vi.mock("react-router-dom", () => ({
  useLocation: mocks.useLocation,
  useParams: () => ({ directionId: "0" }),
  useSearchParams: () => [new URLSearchParams()],
}));

const vehicle = { vehicle: { id: "v1" } } as VehiclePosition;
const route = { routeId: "10" } as Route;

describe("useVehiclePositions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useDataFromRouteLoader.mockReturnValue(undefined);
    mocks.useVehiclePositionsQuery.mockReturnValue({ data: undefined });
    mocks.useCurrentRoute.mockReturnValue({ currentRoute: undefined });
    mocks.useLocation.mockReturnValue({ pathname: "/route/10/direction/0" });
  });

  test("returns empty array off route/stop pages and keeps the query disabled", () => {
    mocks.useLocation.mockReturnValue({ pathname: "/" });
    mocks.useCurrentRoute.mockReturnValue({ currentRoute: route });

    const { result } = renderHook(() => useVehiclePositions());

    expect(result.current.vehiclePositions).toEqual([]);
    expect(mocks.useVehiclePositionsQuery).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: false })
    );
  });

  test("keeps the query disabled without a current route", () => {
    renderHook(() => useVehiclePositions());

    expect(mocks.useVehiclePositionsQuery).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: false })
    );
  });

  test("enables the query on a route page with a current route", () => {
    mocks.useCurrentRoute.mockReturnValue({ currentRoute: route });
    mocks.useVehiclePositionsQuery.mockReturnValue({
      data: { vehiclePositions: [vehicle] },
    });

    const { result } = renderHook(() => useVehiclePositions());

    expect(mocks.useVehiclePositionsQuery).toHaveBeenCalledWith(
      expect.objectContaining({ routeId: "10", direction: 0 }),
      expect.objectContaining({ enabled: true })
    );
    expect(result.current.vehiclePositions).toEqual([vehicle]);
  });

  test("prefers prefetched loader data over query data", () => {
    const loaderVehicle = { vehicle: { id: "loader" } } as VehiclePosition;
    mocks.useCurrentRoute.mockReturnValue({ currentRoute: route });
    mocks.useDataFromRouteLoader.mockImplementation((routeId: string) =>
      routeId === "searchParams"
        ? { vehiclePositions: [loaderVehicle] }
        : undefined
    );
    mocks.useVehiclePositionsQuery.mockReturnValue({
      data: { vehiclePositions: [vehicle] },
    });

    const { result } = renderHook(() => useVehiclePositions());

    expect(result.current.vehiclePositions).toEqual([loaderVehicle]);
  });

  test("returns a stable empty array across renders", () => {
    mocks.useLocation.mockReturnValue({ pathname: "/" });

    const { result, rerender } = renderHook(() => useVehiclePositions());
    const first = result.current.vehiclePositions;
    rerender();

    expect(result.current.vehiclePositions).toBe(first);
  });
});
