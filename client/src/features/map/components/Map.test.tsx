import { render, screen } from "@testing-library/react";
import * as React from "react";
import { Stop, VehiclePosition } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { Map } from "./Map";

const mocks = vi.hoisted(() => ({
  mapProps: vi.fn(),
  stopLayerProps: vi.fn(),
  vehicleLayerProps: vi.fn(),
  useMapMotion: vi.fn(),
  useStops: vi.fn(),
  useRouteShapes: vi.fn(),
  useMergedVehiclePositions: vi.fn(),
  useViewStateSync: vi.fn(),
  useViewStatePathname: vi.fn(),
  useCurrentRoute: vi.fn(),
  useCurrentStop: vi.fn(),
}));

vi.mock("react-map-gl/mapbox", () => ({
  default: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => {
    mocks.mapProps(props);
    return <div data-testid={"map"}>{children}</div>;
  },
  NavigationControl: () => null,
  GeolocateControl: () => null,
  Source: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid={"source"}>{children}</div>
  ),
  Layer: () => <div data-testid={"layer"} />,
}));

vi.mock("./Stop/StopLayer", () => ({
  STOPS_LAYER_ID: "stops",
  StopLayer: (props: Record<string, unknown>) => {
    mocks.stopLayerProps(props);
    return <div data-testid={"stop-layer"} />;
  },
}));

vi.mock("./Vehicle/VehicleLayer", () => ({
  VEHICLES_LAYER_ID: "vehicle-markers",
  VehicleLayer: (props: Record<string, unknown>) => {
    mocks.vehicleLayerProps(props);
    return <div data-testid={"vehicle-layer"} />;
  },
}));

vi.mock("features/map/hooks/UseMapMotion", () => ({
  useMapMotion: mocks.useMapMotion,
}));

vi.mock("features/map/hooks/useStops", () => ({
  useStops: mocks.useStops,
}));

vi.mock("features/map/hooks/useRouteShapes", () => ({
  useRouteShapes: mocks.useRouteShapes,
}));

vi.mock("features/map/hooks/useMergedVehiclePositions", () => ({
  useMergedVehiclePositions: mocks.useMergedVehiclePositions,
}));

vi.mock("features/map/hooks/UseViewStateSync", () => ({
  useViewStateSync: mocks.useViewStateSync,
}));

vi.mock("shared/hooks/UseViewStatePathname", () => ({
  useViewStatePathname: mocks.useViewStatePathname,
}));

vi.mock("shared/hooks/UseCurrentRoute", () => ({
  useCurrentRoute: mocks.useCurrentRoute,
}));

vi.mock("shared/hooks/UseCurrentStop", () => ({
  useCurrentStop: mocks.useCurrentStop,
}));

const stop = { stopId: "s1" } as Stop;
const contextStop = { stopId: "c1" } as Stop;
const vehicle = { vehicle: { id: "v1" } } as VehiclePosition;

describe("Map", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useStops.mockReturnValue({
      stops: [stop],
      contextStops: [contextStop],
    });
    mocks.useRouteShapes.mockReturnValue({ routeShapes: [] });
    mocks.useMergedVehiclePositions.mockReturnValue([vehicle]);
    mocks.useViewStateSync.mockReturnValue({ setViewStateInUrl: vi.fn() });
    mocks.useViewStatePathname.mockReturnValue({});
    mocks.useCurrentRoute.mockReturnValue({ currentRoute: undefined });
    mocks.useCurrentStop.mockReturnValue({ currentStop: undefined });
  });

  test("renders the map with stop and vehicle layers wired to hook data", () => {
    render(<Map />);

    expect(screen.getByTestId("map")).toBeInTheDocument();
    expect(mocks.stopLayerProps).toHaveBeenCalledWith(
      expect.objectContaining({
        stops: [stop],
        selectedStop: undefined,
        disableLod: false,
      })
    );
    expect(mocks.vehicleLayerProps).toHaveBeenCalledWith(
      expect.objectContaining({ vehiclePositions: [vehicle] })
    );
  });

  test("declares all interactive layers for the pointer cursor", () => {
    render(<Map />);

    expect(mocks.mapProps).toHaveBeenCalledWith(
      expect.objectContaining({
        interactiveLayerIds: ["stops", "vehicle-markers"],
      })
    );
  });

  test("drives map motion from context stops and route shapes", () => {
    render(<Map />);

    expect(mocks.useMapMotion).toHaveBeenCalledWith([contextStop], []);
  });

  test("falls back to the Austin default center without a URL view state", () => {
    render(<Map />);

    expect(mocks.mapProps).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 30.2672,
        longitude: -97.7431,
        zoom: 11.5,
      })
    );
  });

  test("uses the URL view state when present", () => {
    mocks.useViewStatePathname.mockReturnValue({
      latitude: 30.4,
      longitude: -97.6,
      zoom: 14,
    });

    render(<Map />);

    expect(mocks.mapProps).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 30.4, longitude: -97.6, zoom: 14 })
    );
  });

  test("disables stop level-of-detail on route pages", () => {
    mocks.useCurrentRoute.mockReturnValue({
      currentRoute: { routeId: "10", routeColor: "ff0000" },
    });

    render(<Map />);

    expect(mocks.stopLayerProps).toHaveBeenCalledWith(
      expect.objectContaining({ disableLod: true })
    );
  });
});
