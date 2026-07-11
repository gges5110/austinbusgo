import { renderHook } from "@testing-library/react";
import { VehiclePosition } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useAllVehiclePositions } from "./useAllVehiclePositions";

const mocks = vi.hoisted(() => ({
  useGtfsRtVehiclePositions: vi.fn(),
  useShowAllVehicles: vi.fn(),
}));

vi.mock("shared/hooks/useGtfsRtFrontend", () => ({
  useGtfsRtVehiclePositions: mocks.useGtfsRtVehiclePositions,
}));

vi.mock("shared/hooks/UseShowAllVehicles", () => ({
  useShowAllVehicles: mocks.useShowAllVehicles,
}));

const vehicle = { vehicle: { id: "v1" } } as VehiclePosition;

describe("useAllVehiclePositions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useShowAllVehicles.mockReturnValue([true]);
    mocks.useGtfsRtVehiclePositions.mockReturnValue({ data: undefined });
  });

  test("returns vehicles from the GTFS-RT feed", () => {
    mocks.useGtfsRtVehiclePositions.mockReturnValue({ data: [vehicle] });

    const { result } = renderHook(() => useAllVehiclePositions());

    expect(result.current.allVehiclePositions).toEqual([vehicle]);
  });

  test("returns empty array and disables the query when toggled off", () => {
    mocks.useShowAllVehicles.mockReturnValue([false]);
    mocks.useGtfsRtVehiclePositions.mockReturnValue({ data: [vehicle] });

    const { result } = renderHook(() => useAllVehiclePositions());

    expect(result.current.allVehiclePositions).toEqual([]);
    expect(mocks.useGtfsRtVehiclePositions).toHaveBeenCalledWith(
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
