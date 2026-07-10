import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useFeatureHoverState } from "./useFeatureHoverState";

const mocks = vi.hoisted(() => {
  const map = {
    getSource: vi.fn(),
    setFeatureState: vi.fn(),
  };
  return {
    map,
    useMap: vi.fn(() => ({ mapId: map as typeof map | undefined })),
  };
});

vi.mock("react-map-gl/mapbox", () => ({
  useMap: mocks.useMap,
}));

describe("useFeatureHoverState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.map.getSource.mockReturnValue({});
    mocks.useMap.mockReturnValue({ mapId: mocks.map });
  });

  test("sets hovered feature state when a feature id is provided", () => {
    renderHook(() => useFeatureHoverState("stops-source", "s1"));

    expect(mocks.map.setFeatureState).toHaveBeenCalledWith(
      { id: "s1", source: "stops-source" },
      { hovered: true }
    );
  });

  test("clears hovered state on unmount", () => {
    const { unmount } = renderHook(() =>
      useFeatureHoverState("stops-source", "s1")
    );
    unmount();

    expect(mocks.map.setFeatureState).toHaveBeenLastCalledWith(
      { id: "s1", source: "stops-source" },
      { hovered: false }
    );
  });

  test("clears the previous feature when the id changes", () => {
    const { rerender } = renderHook(
      ({ id }: { id: string }) => useFeatureHoverState("stops-source", id),
      { initialProps: { id: "s1" } }
    );

    rerender({ id: "s2" });

    expect(mocks.map.setFeatureState).toHaveBeenCalledWith(
      { id: "s1", source: "stops-source" },
      { hovered: false }
    );
    expect(mocks.map.setFeatureState).toHaveBeenLastCalledWith(
      { id: "s2", source: "stops-source" },
      { hovered: true }
    );
  });

  test("does nothing without a feature id", () => {
    renderHook(() => useFeatureHoverState("stops-source", undefined));

    expect(mocks.map.setFeatureState).not.toHaveBeenCalled();
  });

  test("does nothing when the source does not exist yet", () => {
    mocks.map.getSource.mockReturnValue(undefined);

    renderHook(() => useFeatureHoverState("stops-source", "s1"));

    expect(mocks.map.setFeatureState).not.toHaveBeenCalled();
  });

  test("does nothing when the map is not ready", () => {
    mocks.useMap.mockReturnValue({ mapId: undefined });

    expect(() =>
      renderHook(() => useFeatureHoverState("stops-source", "s1"))
    ).not.toThrow();
    expect(mocks.map.setFeatureState).not.toHaveBeenCalled();
  });
});
