import { act, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import * as React from "react";
import { Stop } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { StopLayer } from "./StopLayer";

const mocks = vi.hoisted(() => {
  const map = {
    on: vi.fn(),
    off: vi.fn(),
    getZoom: vi.fn(() => 12),
    getSource: vi.fn(() => ({})),
    setFeatureState: vi.fn(),
  };
  return {
    map,
    isMobile: vi.fn(() => false),
    setStop: vi.fn(),
  };
});

vi.mock("react-map-gl/mapbox", () => ({
  useMap: () => ({ mapId: mocks.map }),
  Source: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid={"source"}>{children}</div>
  ),
  Layer: () => <div data-testid={"layer"} />,
  Popup: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid={"popup"}>{children}</div>
  ),
}));

vi.mock("@mui/material/useMediaQuery", () => ({
  default: () => mocks.isMobile(),
}));

vi.mock("shared/hooks/UseCurrentStop", () => ({
  useCurrentStop: () => ({ currentStop: undefined, setStop: mocks.setStop }),
}));

vi.mock("./StopPeekSheet", () => ({
  StopPeekSheet: ({ stop }: { stop: Stop }) => (
    <div data-testid={"stop-peek-sheet"}>{stop.stopName}</div>
  ),
}));

vi.mock("./StopPopupContent", () => ({
  StopPopupContent: ({ stop }: { stop: Stop }) => (
    <div data-testid={"stop-popup-content"}>{stop.stopName}</div>
  ),
}));

const stop: Stop = {
  stopId: "s1",
  stopName: "First & Main",
  stopCode: "1001",
  stopLoc: { type: "Point", coordinates: [-97.7, 30.2] },
  routes: [],
} as unknown as Stop;

const getLayerHandler = (event: string, layerId: string) =>
  mocks.map.on.mock.calls.find((c) => c[0] === event && c[1] === layerId)?.[2];

const featureEvent = (stopId: string) => ({
  features: [{ properties: { stopId } }],
});

const renderStopLayer = () =>
  render(
    <Provider store={createStore()}>
      <StopLayer selectedStop={undefined} stops={[stop]} />
    </Provider>
  );

describe("StopLayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isMobile.mockReturnValue(false);
  });

  test("registers click and hover handlers on both stop layers (desktop)", () => {
    renderStopLayer();

    for (const layerId of ["stop-circles", "stop-labels"]) {
      expect(getLayerHandler("click", layerId)).toBeDefined();
      expect(getLayerHandler("mouseenter", layerId)).toBeDefined();
      expect(getLayerHandler("mouseleave", layerId)).toBeDefined();
    }
  });

  test("desktop click selects the stop", () => {
    renderStopLayer();

    act(() => {
      getLayerHandler("click", "stop-circles")(featureEvent("s1"));
    });

    expect(mocks.setStop).toHaveBeenCalledWith(stop);
  });

  test("desktop hover shows the popup with stop content", () => {
    renderStopLayer();

    act(() => {
      getLayerHandler("mouseenter", "stop-circles")(featureEvent("s1"));
    });

    expect(screen.getByTestId("stop-popup-content")).toHaveTextContent(
      "First & Main"
    );
  });

  test("ignores clicks on unknown features", () => {
    renderStopLayer();

    act(() => {
      getLayerHandler("click", "stop-circles")(featureEvent("unknown"));
    });

    expect(mocks.setStop).not.toHaveBeenCalled();
  });

  test("mobile tap opens the peek sheet instead of selecting the stop", () => {
    mocks.isMobile.mockReturnValue(true);
    renderStopLayer();

    act(() => {
      getLayerHandler("click", "stop-circles")(featureEvent("s1"));
    });

    expect(mocks.setStop).not.toHaveBeenCalled();
    expect(screen.getByTestId("stop-peek-sheet")).toHaveTextContent(
      "First & Main"
    );
  });

  test("mobile does not register hover handlers", () => {
    mocks.isMobile.mockReturnValue(true);
    renderStopLayer();

    expect(getLayerHandler("mouseenter", "stop-circles")).toBeUndefined();
    expect(getLayerHandler("click", "stop-circles")).toBeDefined();
  });
});
