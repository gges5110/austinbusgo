import { renderHook } from "@testing-library/react";
import { Stop } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useAllStops } from "./useAllStops";

const mocks = vi.hoisted(() => ({
  useAllStops: vi.fn(),
}));

vi.mock("shared/api/generated/api", () => ({
  useAllStops: mocks.useAllStops,
}));

const stop = { stopId: "1001", stopName: "First & Main" } as Stop;

describe("useAllStops", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAllStops.mockReturnValue({
      data: undefined,
      isFetching: false,
    });
  });

  test("returns all stops when enabled", () => {
    mocks.useAllStops.mockReturnValue({
      data: [stop],
      isFetching: false,
    });

    const { result } = renderHook(() => useAllStops(true));

    expect(result.current.allStops).toEqual([stop]);
    expect(mocks.useAllStops).toHaveBeenCalledWith({
      query: expect.objectContaining({ enabled: true }),
    });
  });

  test("returns empty array and disables the query when not enabled", () => {
    mocks.useAllStops.mockReturnValue({
      data: [stop],
      isFetching: false,
    });

    const { result } = renderHook(() => useAllStops(false));

    expect(result.current.allStops).toEqual([]);
    expect(mocks.useAllStops).toHaveBeenCalledWith({
      query: expect.objectContaining({ enabled: false }),
    });
  });

  test("uses a long stale time so the feed isn't refetched on focus", () => {
    renderHook(() => useAllStops(true));

    expect(mocks.useAllStops).toHaveBeenCalledWith({
      query: expect.objectContaining({ staleTime: 6 * 60 * 60 * 1000 }),
    });
  });

  test("returns a stable empty array across renders", () => {
    const { result, rerender } = renderHook(() => useAllStops(true));
    const first = result.current.allStops;
    rerender();

    expect(result.current.allStops).toBe(first);
  });
});
