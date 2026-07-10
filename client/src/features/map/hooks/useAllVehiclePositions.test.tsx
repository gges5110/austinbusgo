import { renderHook } from "@testing-library/react";
import { VehiclePosition } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useAllVehiclePositions } from "./useAllVehiclePositions";

const mocks = vi.hoisted(() => ({
  useRealTimeVehiclePositionsQuery: vi.fn(),
  useShowAllVehicles: vi.fn(),
}));

vi.mock("shared/api/schemas/RealTimeVehiclePositions.generated", () => ({
  useRealTimeVehiclePositionsQuery: mocks.useRealTimeVehiclePositionsQuery,
}));

vi.mock("shared/hooks/UseShowAllVehicles", () => ({
  useShowAllVehicles: mocks.useShowAllVehicles,
}));

const vehicle = { vehicle: { id: "v1" } } as VehiclePosition;

describe("useAllVehiclePositions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useShowAllVehicles.mockReturnValue([true]);
    mocks.useRealTimeVehiclePositionsQuery.mockReturnValue({
      data: undefined,
    });
  });

  test("returns vehicles and filters out nulls", () => {
    mocks.useRealTimeVehiclePositionsQuery.mockReturnValue({
      data: { realTimeVehiclePositions: [vehicle, null] },
    });

    const { result } = renderHook(() => useAllVehiclePositions());

    expect(result.current.allVehiclePositions).toEqual([vehicle]);
  });

  test("returns empty array and disables the query when toggled off", () => {
    mocks.useShowAllVehicles.mockReturnValue([false]);
    mocks.useRealTimeVehiclePositionsQuery.mockReturnValue({
      data: { realTimeVehiclePositions: [vehicle] },
    });

    const { result } = renderHook(() => useAllVehiclePositions());

    expect(result.current.allVehiclePositions).toEqual([]);
    expect(mocks.useRealTimeVehiclePositionsQuery).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ enabled: false })
    );
  });

  test("returns a stable empty array across renders", () => {
    const { result, rerender } = renderHook(() => useAllVehiclePositions());
    const first = result.current.allVehiclePositions;
    rerender();

    expect(result.current.allVehiclePositions).toBe(first);
  });
});
