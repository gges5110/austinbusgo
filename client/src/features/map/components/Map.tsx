import { useTheme } from "@mui/material";
import { useMapMotion } from "features/map/hooks/UseMapMotion";
import { useMergedVehiclePositions } from "features/map/hooks/useMergedVehiclePositions";
import { useRouteShapes } from "features/map/hooks/useRouteShapes";
import { useStops } from "features/map/hooks/useStops";
import { useViewStateSync } from "features/map/hooks/UseViewStateSync";
import * as React from "react";
import { useMemo, useState } from "react";
import ReactMapGL, {
  GeolocateControl,
  Layer,
  NavigationControl,
  Source,
  ViewStateChangeEvent,
} from "react-map-gl/mapbox";
import { useCurrentRoute } from "shared/hooks/UseCurrentRoute";
import { useCurrentStop } from "shared/hooks/UseCurrentStop";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";

import { STOPS_LAYER_ID, StopLayer } from "./Stop/StopLayer";
import { VEHICLES_LAYER_ID, VehicleLayer } from "./Vehicle/VehicleLayer";

export type ViewState = {
  /** Longitude at map center */
  longitude: number;
  /** Latitude at map center */
  latitude: number;
  /** Map zoom level */
  zoom: number;
};

export type Coordinate = [number, number];

const defaultCenter: Coordinate = [-97.7431, 30.2672];

export const Map: React.FunctionComponent = () => {
  const { latitude, longitude, zoom } = useViewStatePathname();
  const [viewState, setViewState] = useState<ViewState>({
    latitude: latitude || defaultCenter[1],
    longitude: longitude || defaultCenter[0],
    zoom: zoom || 11.5,
  });
  const [cursor, setCursor] = useState("auto");
  const vehiclePositions = useMergedVehiclePositions();
  const { stops, contextStops } = useStops();
  const { routeShapes } = useRouteShapes();
  const theme = useTheme();
  const { currentRoute: route } = useCurrentRoute();
  const { currentStop: stop } = useCurrentStop();

  const routeShapeGeoJSON = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: routeShapes.map((shape) => ({
        type: "Feature" as const,
        geometry: shape as GeoJSON.LineString,
        properties: {},
      })),
    }),
    [routeShapes]
  );

  useMapMotion(contextStops, routeShapes);
  const { setViewStateInUrl } = useViewStateSync(viewState);

  const onMoveEnd = (event: ViewStateChangeEvent) => {
    // only setting view state in url after movement to prevent quick navigation from infinite loop
    setViewStateInUrl(event.viewState);
  };

  const isRoutesPage = !!route;
  const darkMode = theme.palette.mode === "dark";

  return (
    <ReactMapGL
      id={"mapId"}
      {...viewState}
      cursor={cursor}
      interactiveLayerIds={[STOPS_LAYER_ID, VEHICLES_LAYER_ID]}
      mapStyle={
        darkMode
          ? "mapbox://styles/mapbox/dark-v11"
          : "mapbox://styles/mapbox/streets-v12"
      }
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
      onMouseEnter={() => setCursor("pointer")}
      onMouseLeave={() => setCursor("auto")}
      onMove={(event) => setViewState(event.viewState)}
      onMoveEnd={onMoveEnd}
    >
      <NavigationControl position={"bottom-right"} visualizePitch={true} />
      <GeolocateControl
        position={"bottom-right"}
        positionOptions={{ enableHighAccuracy: true }}
        showUserLocation={true}
        trackUserLocation={true}
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

      <StopLayer
        darkMode={darkMode}
        disableLod={isRoutesPage}
        selectedStop={stop}
        stops={stops}
      />

      <VehicleLayer vehiclePositions={vehiclePositions} />
    </ReactMapGL>
  );
};
