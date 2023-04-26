import * as React from "react";
import { MapProvider } from "react-map-gl";
import { Map, MapProps } from "./Map";

// In order to use the useMap hook in the Map component, we need to wrap it with MapProvider
export const MapWrapper: React.FunctionComponent<MapProps> = ({
  trip,
  stops,
  routeShapes,
  vehiclePositions,
  runningTrips,
  loading,
  setTrip,
}) => (
  <MapProvider>
    <Map
      trip={trip}
      loading={loading}
      routeShapes={routeShapes}
      stops={stops}
      vehiclePositions={vehiclePositions}
      runningTrips={runningTrips}
      setTrip={setTrip}
    />
  </MapProvider>
);
