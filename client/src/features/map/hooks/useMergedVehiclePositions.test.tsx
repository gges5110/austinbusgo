import { renderHook } from "@testing-library/react";
import { VehiclePosition } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useMergedVehiclePositions } from "./useMergedVehiclePositions";

const mocks = vi.hoisted(() => ({
  useVehiclePositions: vi.fn(),
  useAllVehiclePositions: vi.fn(),
}));

vi.mock("features/map/hooks/useVehiclePositions", () => ({
  useVehiclePositions: mocks.useVehiclePositions,
}));

vi.mock("features/map/hooks/useAllVehiclePositions", () => ({
  useAllVehiclePositions: mocks.useAllVehiclePositions,
}));

const makeVehicle = (id: string, routeId: string): VehiclePosition =>
  ({
    vehicle: { id },
    trip: { routeId },
  }) as unknown as VehiclePosition;

describe("useMergedVehiclePositions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("merges route-specific and all-vehicle feeds, route-specific wins", () => {
    const routeVehicle = makeVehicle("v1", "10");
    const duplicate = makeVehicle("v1", "10");
    const other = makeVehicle("v2", "20");
    mocks.useVehiclePositions.mockReturnValue({
      vehiclePositions: [routeVehicle],
    });
    mocks.useAllVehiclePositions.mockReturnValue({
      allVehiclePositions: [duplicate, other],
    });

    const { result } = renderHook(() => useMergedVehiclePositions());

    expect(result.current).toEqual([routeVehicle, other]);
    expect(result.current[0]).toBe(routeVehicle);
  });

  test("keeps vehicles without an id from the all-vehicles feed", () => {
    const noId = { position: { latitude: 1, longitude: 2 } } as VehiclePosition;
    mocks.useVehiclePositions.mockReturnValue({
      vehiclePositions: [makeVehicle("v1", "10")],
    });
    mocks.useAllVehiclePositions.mockReturnValue({
      allVehiclePositions: [noId],
    });

    const { result } = renderHook(() => useMergedVehiclePositions());

    expect(result.current).toHaveLength(2);
    expect(result.current[1]).toBe(noId);
  });

  test("returns a stable reference when inputs do not change", () => {
    const vehiclePositions = [makeVehicle("v1", "10")];
    const allVehiclePositions = [makeVehicle("v2", "20")];
    mocks.useVehiclePositions.mockReturnValue({ vehiclePositions });
    mocks.useAllVehiclePositions.mockReturnValue({ allVehiclePositions });

    const { result, rerender } = renderHook(() => useMergedVehiclePositions());
    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });
});
