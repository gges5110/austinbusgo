import { render } from "@testing-library/react";
import React from "react";
import {
  _MapContext as MapContext,
  MapContextProps,
  WebMercatorViewport,
} from "react-map-gl";
import {
  VehiclePosition,
  VehicleStopStatus,
} from "../../../interfaces/interface.d";
import { VehicleMarker } from "./VehicleMarker";

describe("VehicleMarker", () => {
  test("matches snapshot", () => {
    const vehiclePosition: VehiclePosition = {
      trip: {
        tripId: "2437609_MRG_1",
        routeId: "1",
        startDate: "20200819",
        startTime: "",
        __typename: "TripDescriptor",
      },
      vehicle: {
        id: "2054",
        label: "2054",
        licensePlate: "",
        __typename: "VehicleDescriptor",
      },
      position: {
        latitude: 30.27431297302246,
        longitude: -97.744384765625,
        bearing: 197.70184326171875,
        speed: 8.985504150390625,
        __typename: "Position",
      },
      stopId: "2611",
      currentStatus: VehicleStopStatus.InTransitTo,
      timestamp: 1597897702,
      congestionLevel: 0,
      __typename: "VehiclePosition",
    };

    const mockStaticContext: MapContextProps = {
      viewport: new WebMercatorViewport({
        width: 800,
        height: 600,
        longitude: -122.58,
        latitude: 37.74,
        zoom: 14,
      }),
      mapContainer: null,
      isDragging: false,
    };
    const { container } = render(
      <MapContext.Provider value={mockStaticContext}>
        <VehicleMarker vehiclePosition={vehiclePosition} onClick={jest.fn()} />
      </MapContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
