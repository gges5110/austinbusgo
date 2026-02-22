import { useTheme } from "@mui/material";
import { useMapMotion } from "features/map/hooks/UseMapMotion";
import { useRouteShape } from "features/map/hooks/UseRouteShape";
import { useRouteShapes } from "features/map/hooks/useRouteShapes";
import { useStops } from "features/map/hooks/useStops";
import { useVehiclePositions } from "features/map/hooks/useVehiclePositions";
import { useViewStateSync } from "features/map/hooks/UseViewStateSync";
import * as React from "react";
import { useState } from "react";
import ReactMapGL, {
  GeolocateControl,
  Layer,
  NavigationControl,
  Source,
  useMap,
  ViewStateChangeEvent,
} from "react-map-gl/mapbox";
import { useCurrentRoute } from "shared/hooks/UseCurrentRoute";
import { useCurrentStop } from "shared/hooks/UseCurrentStop";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { VehiclePosition } from "shared/types/interface.d";

import { StopMarkers } from "./Stop/StopMarkers";
import { VehicleMarkers } from "./Vehicle/VehicleMarkers";

export type ViewState = {
  /** Longitude at map center */
  longitude: number;
  /** Latitude at map center */
  latitude: number;
  /** Map zoom level */
  zoom: number;
};

export const vehicleZoomLevel = 16;
const defaultCenter: Coordinate = [-97.7431, 30.2672];
export declare type Coordinate = [number, number];

export const Map: React.FunctionComponent = () => {
  const { mapId: map } = useMap();
  const { latitude, longitude, zoom } = useViewStatePathname();
  const initialViewState = {
    latitude: latitude || defaultCenter[1],
    longitude: longitude || defaultCenter[0],
    zoom: zoom || 11.5,
  };
  const [viewState, setViewState] = useState<ViewState>(initialViewState);
  // Separate state for query params — only updated when panning stops to
  // prevent firing a NearByStops query on every animation frame.
  const [queryViewState, setQueryViewState] =
    useState<ViewState>(initialViewState);
  const { vehiclePositions } = useVehiclePositions();
  const { stops, contextStops } = useStops(queryViewState);
  const { routeShapes } = useRouteShapes();
  const theme = useTheme();
  const { currentRoute: route } = useCurrentRoute();
  const { currentStop: stop, setStop: setSelectedStop } = useCurrentStop();

  const { routeShapeGeoJSON } = useRouteShape(routeShapes);

  useMapMotion(contextStops, routeShapes);
  const { setViewStateInUrl } = useViewStateSync(viewState);

  const onViewportChange = (event: ViewStateChangeEvent) => {
    setViewState(event.viewState);
  };

  const onMoveEnd = (event: ViewStateChangeEvent) => {
    // only setting view state in url after movement to prevent quick navigation from infinite loop
    setViewStateInUrl(event.viewState);
    setQueryViewState(event.viewState);
  };

  const vehicleMarkerOnClick = (vehicle: VehiclePosition) => {
    if (map && vehicle.position) {
      map.flyTo({
        center: [vehicle.position.longitude, vehicle.position.latitude],
        zoom: vehicleZoomLevel,
      });
    }
  };

  return (
    <>
      <ReactMapGL
        id={"mapId"}
        {...viewState}
        mapStyle={
          theme.palette.mode === "dark"
            ? "mapbox://styles/mapbox/dark-v11"
            : "mapbox://styles/mapbox/streets-v12"
        }
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
        onMove={onViewportChange}
        onMoveEnd={onMoveEnd}
      >
        <NavigationControl position={"bottom-right"} visualizePitch={true} />
        <GeolocateControl
          position={"bottom-right"}
          positionOptions={{ enableHighAccuracy: true }}
          showUserLocation={true}
          trackUserLocation={true}
        />

        <StopMarkers
          selectedStop={stop}
          setSelectedStop={setSelectedStop}
          stops={stops}
        />
        <VehicleMarkers
          onClick={vehicleMarkerOnClick}
          vehiclePositions={vehiclePositions}
        />

        <Source data={routeShapeGeoJSON} id={"route-shapes"} type={"geojson"}>
          <Layer
            id={"point"}
            paint={{
              "line-color": `#${route?.routeColor || "a5a5a5"}`,
              "line-width": 5,
            }}
            type={"line"}
          />
        </Source>
      </ReactMapGL>
    </>
  );
};
