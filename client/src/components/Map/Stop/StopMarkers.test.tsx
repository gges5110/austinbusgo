import React from "react";
import { render } from "@testing-library/react";
import { stops } from "../../../mockData/Stop.mock";
import {
  _MapContext as MapContext,
  MapContextProps,
  WebMercatorViewport,
} from "react-map-gl";
import { StopMarkers } from "./StopMarkers";

describe("StopMarkers", () => {
  test("matches snapshot", () => {
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
        <StopMarkers
          stops={stops}
          setSelectedStop={jest.fn()}
          direction={false}
        />
      </MapContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
