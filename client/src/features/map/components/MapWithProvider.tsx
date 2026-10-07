import "mapbox-gl/dist/mapbox-gl.css";

import { Map } from "features/map/components/Map";
import * as React from "react";
import { MapProvider } from "react-map-gl/mapbox";

/**
 * Everything Mapbox-related, in one lazily loaded chunk (see LazyMap):
 * mapbox-gl, react-map-gl, the map layers, and Mapbox's stylesheet, bundled
 * from the installed package so it matches the JS version and never blocks
 * the first paint.
 */
const MapWithProvider: React.FC = () => (
  <MapProvider>
    <Map />
  </MapProvider>
);

export default MapWithProvider;
