import { act, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import * as React from "react";
import { VehiclePosition } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { VehicleLayer } from "./VehicleLayer";

const mocks = vi.hoisted(() => {
  const map = {
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    isStyleLoaded: vi.fn(() => true),
    hasImage: vi.fn(() => true),
    addImage: vi.fn(),
    getSource: vi.fn(() => ({})),
    setFeatureState: vi.fn(),
  };
  return {
    map,
    isMobile: vi.fn(() => false),
    navigate: vi.fn(),
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

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("shared/hooks/UseViewStatePathname", () => ({
  useViewStatePathname: () => ({ viewStatePathname: "/@30.2,-97.7,12z" }),
}));

vi.mock("./VehiclePeekSheet", () => ({
  VehiclePeekSheet: ({
    vehiclePosition,
  }: {
    vehiclePosition: VehiclePosition;
  }) => (
    <div data-testid={"vehicle-peek-sheet"}>{vehiclePosition.vehicle?.id}</div>
  ),
}));

vi.mock("./VehiclePopupContainer", () => ({
  VehiclePopupContainer: ({
    vehiclePosition,
  }: {
    vehiclePosition: VehiclePosition;
  }) => (
    <div data-testid={"vehicle-popup-content"}>
      {vehiclePosition.vehicle?.id}
    </div>
  ),
}));

const vehicle: VehiclePosition = {
  vehicle: { id: "v1" },
  trip: { routeId: "10" },
  position: { latitude: 30.2, longitude: -97.7, bearing: 90 },
  currentStatus: "IN_TRANSIT_TO",
} as unknown as VehiclePosition;

const getLayerHandler = (event: string, layerId: string) =>
  mocks.map.on.mock.calls.find((c) => c[0] === event && c[1] === layerId)?.[2];

// Map-level (background) click handler is registered without a layer id
const getMapClickHandler = () =>
  mocks.map.on.mock.calls.find(
    (c) => c[0] === "click" && typeof c[1] === "function"
  )?.[1];

const featureEvent = (vehicleId: string) => ({
  features: [{ properties: { vehicleId } }],
});

const renderVehicleLayer = () =>
  render(
    <Provider store={createStore()}>
      <VehicleLayer vehiclePositions={[vehicle]} />
    </Provider>
  );

describe("VehicleLayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isMobile.mockReturnValue(false);
  });

  test("desktop click pins the popup and navigates to the vehicle's route", () => {
    renderVehicleLayer();

    act(() => {
      getLayerHandler("click", "vehicle-markers")(featureEvent("v1"));
    });

    expect(mocks.navigate).toHaveBeenCalledWith(
      "/route/10/direction/0/@30.2,-97.7,12z"
    );
    expect(screen.getByTestId("vehicle-popup-content")).toHaveTextContent("v1");
  });

  test("desktop hover shows the popup without navigating", () => {
    renderVehicleLayer();

    act(() => {
      getLayerHandler("mouseenter", "vehicle-markers")(featureEvent("v1"));
    });

    expect(screen.getByTestId("vehicle-popup-content")).toHaveTextContent("v1");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  test("map background click dismisses the pinned popup, but not the click that pinned it", () => {
    renderVehicleLayer();

    // Vehicle click and background click fire on the same click; the ref
    // guard keeps the popup open the first time.
    act(() => {
      getLayerHandler("click", "vehicle-markers")(featureEvent("v1"));
      getMapClickHandler()();
    });
    expect(screen.getByTestId("vehicle-popup-content")).toBeInTheDocument();

    // A later background click (no vehicle under the cursor) dismisses it
    act(() => {
      getMapClickHandler()();
    });
    expect(
      screen.queryByTestId("vehicle-popup-content")
    ).not.toBeInTheDocument();
  });

  test("mobile tap opens the peek sheet and does not navigate", () => {
    mocks.isMobile.mockReturnValue(true);
    renderVehicleLayer();

    act(() => {
      getLayerHandler("click", "vehicle-markers")(featureEvent("v1"));
    });

    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(screen.getByTestId("vehicle-peek-sheet")).toHaveTextContent("v1");
  });

  test("mobile does not register hover handlers", () => {
    mocks.isMobile.mockReturnValue(true);
    renderVehicleLayer();

    expect(getLayerHandler("mouseenter", "vehicle-markers")).toBeUndefined();
    expect(getLayerHandler("click", "vehicle-markers")).toBeDefined();
  });

  test("ignores clicks on unknown vehicles", () => {
    renderVehicleLayer();

    act(() => {
      getLayerHandler("click", "vehicle-markers")(featureEvent("unknown"));
    });

    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("vehicle-popup-content")
    ).not.toBeInTheDocument();
  });
});
