import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useAllVehiclePositions } from "features/map/hooks/useAllVehiclePositions";
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
  MapLayerMouseEvent,
  NavigationControl,
  Source,
  ViewStateChangeEvent,
} from "react-map-gl/mapbox";
import { useCurrentRoute } from "shared/hooks/UseCurrentRoute";
import { useCurrentStop } from "shared/hooks/UseCurrentStop";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";

import {
  STOP_CIRCLES_LAYER_ID,
  STOP_LABELS_LAYER_ID,
  StopLayer,
} from "./Stop/StopLayer";
import { VEHICLE_CIRCLES_LAYER_ID, VehicleLayer } from "./Vehicle/VehicleLayer";

export type ViewState = {
  /** Longitude at map center */
  longitude: number;
  /** Latitude at map center */
  latitude: number;
  /** Map zoom level */
  zoom: number;
};

const defaultCenter: Coordinate = [-97.7431, 30.2672];
export declare type Coordinate = [number, number];

export const Map: React.FunctionComponent = () => {
  const { latitude, longitude, zoom } = useViewStatePathname();
  const initialViewState = {
    latitude: latitude || defaultCenter[1],
    longitude: longitude || defaultCenter[0],
    zoom: zoom || 11.5,
  };
  const [viewState, setViewState] = useState<ViewState>(initialViewState);
  const [cursor, setCursor] = useState("auto");
  // Separate state for query params — only updated when panning stops to
  // prevent firing a NearByStops query on every animation frame.
  const [queryViewState, setQueryViewState] =
    useState<ViewState>(initialViewState);
  const { vehiclePositions } = useVehiclePositions();
  const { allVehiclePositions } = useAllVehiclePositions();

  // Merge route-specific and all-vehicles, deduplicating by vehicle id
  const routeVehicleIds = new Set(
    vehiclePositions.map((v) => v.vehicle?.id).filter(Boolean)
  );
  const mergedVehiclePositions = [
    ...vehiclePositions,
    ...allVehiclePositions.filter(
      (v) => !v.vehicle?.id || !routeVehicleIds.has(v.vehicle.id)
    ),
  ];
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

  const isRoutesPage = !!route;
  const darkMode = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const onStopLayerClick = (event: MapLayerMouseEvent) => {
    // On mobile, StopLayer handles the click to show the peek sheet;
    // skip navigation here to avoid opening the stop page simultaneously.
    if (isMobile) return;
    const feature = event.features?.[0];
    if (!feature) return;
    const stopId = feature.properties?.stopId as string | undefined;
    if (!stopId) return;
    const clickedStop = stops.find((s) => s.stopId === stopId);
    if (clickedStop) {
      setSelectedStop(clickedStop);
    }
  };

  return (
    <>
      <ReactMapGL
        id={"mapId"}
        {...viewState}
        cursor={cursor}
        interactiveLayerIds={[
          STOP_CIRCLES_LAYER_ID,
          STOP_LABELS_LAYER_ID,
          VEHICLE_CIRCLES_LAYER_ID,
        ]}
        mapStyle={
          darkMode
            ? "mapbox://styles/mapbox/dark-v11"
            : "mapbox://styles/mapbox/streets-v12"
        }
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
        onClick={onStopLayerClick}
        onMouseEnter={() => setCursor("pointer")}
        onMouseLeave={() => setCursor("auto")}
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

        <VehicleLayer vehiclePositions={mergedVehiclePositions} />
      </ReactMapGL>
    </>
  );
};
