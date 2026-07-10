import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useLayerEvents, useMapClick } from "./useLayerEvents";

const mocks = vi.hoisted(() => {
  const map = {
    on: vi.fn(),
    off: vi.fn(),
  };
  return {
    map,
    useMap: vi.fn(() => ({ mapId: map as typeof map | undefined })),
  };
});

vi.mock("react-map-gl/mapbox", () => ({
  useMap: mocks.useMap,
}));

const LAYER_IDS = ["layer-a", "layer-b"];

describe("useLayerEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMap.mockReturnValue({ mapId: mocks.map });
  });

  test("registers provided handlers on every layer", () => {
    const onClick = vi.fn();
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();

    renderHook(() =>
      useLayerEvents(LAYER_IDS, { onClick, onMouseEnter, onMouseLeave })
    );

    for (const layerId of LAYER_IDS) {
      expect(mocks.map.on).toHaveBeenCalledWith("click", layerId, onClick);
      expect(mocks.map.on).toHaveBeenCalledWith(
        "mouseenter",
        layerId,
        onMouseEnter
      );
      expect(mocks.map.on).toHaveBeenCalledWith(
        "mouseleave",
        layerId,
        onMouseLeave
      );
    }
  });

  test("skips undefined handlers", () => {
    const onClick = vi.fn();

    renderHook(() => useLayerEvents(LAYER_IDS, { onClick }));

    expect(mocks.map.on).toHaveBeenCalledTimes(LAYER_IDS.length);
    expect(mocks.map.on).toHaveBeenCalledWith("click", "layer-a", onClick);
  });

  test("removes handlers on unmount", () => {
    const onClick = vi.fn();
    const { unmount } = renderHook(() =>
      useLayerEvents(LAYER_IDS, { onClick })
    );

    unmount();

    for (const layerId of LAYER_IDS) {
      expect(mocks.map.off).toHaveBeenCalledWith("click", layerId, onClick);
    }
  });

  test("re-registers when a handler changes", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ onClick }: { onClick: () => void }) =>
        useLayerEvents(LAYER_IDS, { onClick }),
      { initialProps: { onClick: first } }
    );

    rerender({ onClick: second });

    expect(mocks.map.off).toHaveBeenCalledWith("click", "layer-a", first);
    expect(mocks.map.on).toHaveBeenCalledWith("click", "layer-a", second);
  });

  test("does nothing when the map is not ready", () => {
    mocks.useMap.mockReturnValue({ mapId: undefined });

    expect(() =>
      renderHook(() => useLayerEvents(LAYER_IDS, { onClick: vi.fn() }))
    ).not.toThrow();
    expect(mocks.map.on).not.toHaveBeenCalled();
  });
});

describe("useMapClick", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMap.mockReturnValue({ mapId: mocks.map });
  });

  test("registers a map-level click handler and cleans up", () => {
    const onClick = vi.fn();
    const { unmount } = renderHook(() => useMapClick(onClick));

    expect(mocks.map.on).toHaveBeenCalledWith("click", onClick);

    unmount();
    expect(mocks.map.off).toHaveBeenCalledWith("click", onClick);
  });
});
