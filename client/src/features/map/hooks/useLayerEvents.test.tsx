import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useLayerEvents, useMapClick } from "./useLayerEvents";

const mocks = vi.hoisted(() => {
  const rawMap = {
    addInteraction: vi.fn(),
    removeInteraction: vi.fn(),
  };
  const map = { getMap: () => rawMap };
  return {
    rawMap,
    map,
    useMap: vi.fn(() => ({ mapId: map as typeof map | undefined })),
  };
});

vi.mock("react-map-gl/mapbox", () => ({
  useMap: mocks.useMap,
}));

const LAYER_IDS = ["layer-a", "layer-b"];

const interactionFor = (id: string) => {
  const call = [...mocks.rawMap.addInteraction.mock.calls]
    .reverse()
    .find(([interactionId]) => interactionId === id);
  expect(call).toBeDefined();
  return call![1];
};

describe("useLayerEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMap.mockReturnValue({ mapId: mocks.map });
  });

  test("registers an interaction per layer and event type", () => {
    const onClick = vi.fn();
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();

    renderHook(() =>
      useLayerEvents(LAYER_IDS, { onClick, onMouseEnter, onMouseLeave })
    );

    for (const layerId of LAYER_IDS) {
      for (const type of ["click", "mouseenter", "mouseleave"]) {
        const interaction = interactionFor(`${layerId}-${type}`);
        expect(interaction.type).toBe(type);
        expect(interaction.target).toEqual({ layerId });
      }
    }
  });

  test("handler receives the feature as features[0] and consumes the event", () => {
    const onClick = vi.fn();
    renderHook(() => useLayerEvents(LAYER_IDS, { onClick }));

    const interaction = interactionFor("layer-a-click");
    const feature = { properties: { stopId: "s1" } };
    const consumed = interaction.handler({
      feature,
      point: { x: 1, y: 2 },
      lngLat: { lng: -97, lat: 30 },
      originalEvent: {},
    });

    expect(consumed).toBe(true);
    expect(onClick).toHaveBeenCalledWith(
      expect.objectContaining({ features: [feature] })
    );
  });

  test("skips undefined handlers", () => {
    const onClick = vi.fn();

    renderHook(() => useLayerEvents(LAYER_IDS, { onClick }));

    expect(mocks.rawMap.addInteraction).toHaveBeenCalledTimes(LAYER_IDS.length);
    expect(interactionFor("layer-a-click")).toBeDefined();
  });

  test("removes interactions on unmount", () => {
    const onClick = vi.fn();
    const { unmount } = renderHook(() =>
      useLayerEvents(LAYER_IDS, { onClick })
    );

    unmount();

    for (const layerId of LAYER_IDS) {
      expect(mocks.rawMap.removeInteraction).toHaveBeenCalledWith(
        `${layerId}-click`
      );
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

    expect(mocks.rawMap.removeInteraction).toHaveBeenCalledWith(
      "layer-a-click"
    );
    interactionFor("layer-a-click").handler({
      feature: undefined,
      point: {},
      lngLat: {},
      originalEvent: {},
    });
    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
  });

  test("does nothing when the map is not ready", () => {
    mocks.useMap.mockReturnValue({ mapId: undefined });

    expect(() =>
      renderHook(() => useLayerEvents(LAYER_IDS, { onClick: vi.fn() }))
    ).not.toThrow();
    expect(mocks.rawMap.addInteraction).not.toHaveBeenCalled();
  });
});

describe("useMapClick", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMap.mockReturnValue({ mapId: mocks.map });
  });

  test("registers a background click interaction and cleans up", () => {
    const onClick = vi.fn();
    const { unmount } = renderHook(() => useMapClick(onClick));

    const interaction = interactionFor("map-background-click");
    expect(interaction.type).toBe("click");
    expect(interaction.target).toBeUndefined();

    interaction.handler({ point: {}, lngLat: {}, originalEvent: {} });
    expect(onClick).toHaveBeenCalled();

    unmount();
    expect(mocks.rawMap.removeInteraction).toHaveBeenCalledWith(
      "map-background-click"
    );
  });
});
