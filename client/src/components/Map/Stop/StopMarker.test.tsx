import React from "react";
import { stop } from "../../../mockData/Stop.mock";
import { StopMarker } from "./StopMarker";
import { render } from "@testing-library/react";
import {
  _MapContext as MapContext,
  MapContextProps,
  WebMercatorViewport,
} from "react-map-gl";

describe("StopMarker", () => {
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
        <StopMarker direction={true} stop={stop} />
      </MapContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
