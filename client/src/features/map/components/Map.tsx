import { useMediaQuery, useTheme } from "@mui/material";
import { useLightPreset } from "features/map/hooks/useLightPreset";
import { useMapMotion } from "features/map/hooks/UseMapMotion";
import { useMergedVehiclePositions } from "features/map/hooks/useMergedVehiclePositions";
import { useRouteShapes } from "features/map/hooks/useRouteShapes";
import { useStops } from "features/map/hooks/useStops";
import { useViewStateSync } from "features/map/hooks/UseViewStateSync";
import { toVehiclePositions } from "features/nearby/utils/mapData";
import { useAtom } from "jotai";
import * as React from "react";
import { useCallback, useMemo, useState } from "react";
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
import { nearbyFocusAtom } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

import { NearbyFocusLayer } from "./Nearby/NearbyFocusLayer";
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

// Stable empty list so useMapMotion's effect doesn't re-run on each render
const NO_CONTEXT_STOPS: Stop[] = [];

export const Map: React.FunctionComponent = () => {
  const { latitude, longitude, zoom } = useViewStatePathname();
  const [viewState, setViewState] = useState<ViewState>({
    latitude: latitude || defaultCenter[1],
    longitude: longitude || defaultCenter[0],
    zoom: zoom || 11.5,
  });
  const [cursor, setCursor] = useState("auto");
  const mergedVehiclePositions = useMergedVehiclePositions();
  // The Nearby screen narrows the map to the buses headed to its stop
  const [nearbyFocus, setNearbyFocus] = useAtom(nearbyFocusAtom);
  const nearbyVehiclePositions = useMemo(
    () => (nearbyFocus ? toVehiclePositions(nearbyFocus.arrivals) : []),
    [nearbyFocus]
  );
  const vehiclePositions = nearbyFocus
    ? nearbyVehiclePositions
    : mergedVehiclePositions;
  const selectedNearbyVehicleId = nearbyFocus?.arrivals.find(
    (arrival) => arrival.tripId === nearbyFocus.selectedTripId
  )?.vehicle?.id;
  const selectNearbyVehicle = useCallback(
    (vehicleId: string) =>
      setNearbyFocus((focus) => {
        const tripId = focus?.arrivals.find(
          (arrival) => arrival.vehicle?.id === vehicleId
        )?.tripId;
        return focus && tripId ? { ...focus, selectedTripId: tripId } : focus;
      }),
    [setNearbyFocus]
  );
  const { stops, contextStops } = useStops();
  const { routeShapes } = useRouteShapes();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // On phones the tab bar (and Nearby's sheet) cover the bottom of the map
  const controlsPosition = isMobile ? "top-right" : "bottom-right";
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

  const isRoutesPage = !!route;
  const darkMode = theme.palette.mode === "dark";
  const routeColorHex = route?.routeColor || "a5a5a5";
  // The gradient validator only accepts rgb()/rgba()/named colors here,
  // not 8-digit hex, so build rgba strings from the GTFS hex color
  const [r, g, b] = [0, 2, 4].map((i) =>
    parseInt(routeColorHex.slice(i, i + 2), 16)
  );

  // Fade the first stretch of the line so riders can read the direction of
  // travel at a glance (line-progress runs start -> end of each shape)
  const routeLineGradient = useMemo(
    () =>
      [
        "interpolate",
        ["linear"],
        ["line-progress"],
        0,
        `rgba(${r}, ${g}, ${b}, 0.35)`,
        0.25,
        `rgb(${r}, ${g}, ${b})`,
        1,
        `rgb(${r}, ${g}, ${b})`,
      ] as unknown as mapboxgl.Expression,
    [r, g, b]
  );

  // Nearby frames the map itself (NearbyFocusLayer); the generic
  // fit-to-context-stops motion would undo that on every refresh
  useMapMotion(nearbyFocus ? NO_CONTEXT_STOPS : contextStops, routeShapes);
  useLightPreset(darkMode);
  const { setViewStateInUrl } = useViewStateSync(viewState);

  const onMoveEnd = (event: ViewStateChangeEvent) => {
    // only setting view state in url after movement to prevent quick navigation from infinite loop
    setViewStateInUrl(event.viewState);
  };

  return (
    <ReactMapGL
      id={"mapId"}
      {...viewState}
      cursor={cursor}
      interactiveLayerIds={[STOPS_LAYER_ID, VEHICLES_LAYER_ID]}
      mapStyle={"mapbox://styles/mapbox/standard"}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
      onMouseEnter={() => setCursor("pointer")}
      onMouseLeave={() => setCursor("auto")}
      onMove={(event) => setViewState(event.viewState)}
      onMoveEnd={onMoveEnd}
    >
      <NavigationControl position={controlsPosition} visualizePitch={true} />
      <GeolocateControl
        position={controlsPosition}
        positionOptions={{ enableHighAccuracy: true }}
        showUserLocation={true}
        trackUserLocation={true}
      />

      <Source
        data={routeShapeGeoJSON}
        id={"route-shapes"}
        lineMetrics={true}
        type={"geojson"}
      >
        <Layer
          id={"point"}
          layout={{
            "line-cap": "round",
            "line-join": "round",
          }}
          paint={{
            "line-gradient": routeLineGradient,
            "line-width": 5,
          }}
          slot={"middle"}
          type={"line"}
        />
      </Source>

      <StopLayer
        darkMode={darkMode}
        disableLod={isRoutesPage}
        selectedStop={stop}
        stops={stops}
      />

      <VehicleLayer
        emphasizedVehicleId={selectedNearbyVehicleId}
        onVehicleSelect={nearbyFocus ? selectNearbyVehicle : undefined}
        vehiclePositions={vehiclePositions}
      />

      {nearbyFocus && <NearbyFocusLayer focus={nearbyFocus} stop={stop} />}
    </ReactMapGL>
  );
};
