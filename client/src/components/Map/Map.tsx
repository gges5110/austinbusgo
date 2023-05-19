import { Popper, useTheme } from "@mui/material";
import Fab from "@mui/material/Fab";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import * as React from "react";
import { useState } from "react";
import ReactMapGL, {
  Layer,
  Source,
  useMap,
  ViewStateChangeEvent,
} from "react-map-gl";
import {
  LineString,
  Route,
  Stop,
  VehiclePosition,
} from "../../interfaces/interface.d";
import { StopMarkers } from "./Stop/StopMarkers";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";
import { useUserLocation } from "../../hooks/Map/UseUserLocation";
import { useMapMotion } from "../../hooks/Map/UseMapMotion";
import { useRouteShape } from "../../hooks/Map/UseRouteShape";
import { useViewStateSync } from "../../hooks/Map/UseViewStateSync";
import { AssistiveChips } from "./AssistiveChips/AssistiveChips";
import { VehicleMarkers } from "./Vehicle/VehicleMarkers";

export type ViewState = {
  /** Longitude at map center */
  longitude: number;
  /** Latitude at map center */
  latitude: number;
  /** Map zoom level */
  zoom: number;
};

export interface MapProps {
  readonly route?: Route;
  readonly stop?: Stop;
  readonly routeShapes: LineString[];
  readonly stops: Stop[];
  readonly vehiclePositions: VehiclePosition[];

  setSelectedStop(stop: Stop): void;
}

export const vehicleZoomLevel = 16;
const defaultCenter: Coordinate = [-97.7431, 30.2672];
export declare type Coordinate = [number, number];

export const Map: React.FunctionComponent<MapProps> = ({
  route,
  stops,
  stop,
  setSelectedStop,
  routeShapes,
  vehiclePositions,
}) => {
  const { mapId: map } = useMap();
  const theme = useTheme();

  const { routeShapeGeoJSON } = useRouteShape(routeShapes);
  const { latitude, longitude, zoom } = useViewStatePathname();
  const [viewState, setViewState] = useState<ViewState>({
    latitude: latitude || defaultCenter[1],
    longitude: longitude || defaultCenter[0],
    zoom: zoom || 11.5,
  });

  useMapMotion(viewState, stop, stops, routeShapes);
  const { userLocationOnClick } = useUserLocation(viewState);
  const { setViewStateInUrl } = useViewStateSync(viewState);

  const onViewportChange = (event: ViewStateChangeEvent) => {
    setViewState(event.viewState);
  };

  const onMoveEnd = (event: ViewStateChangeEvent) => {
    // only setting view state in url after movement to prevent quick navigation from infinite loop
    setViewStateInUrl(event.viewState);
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
        onMove={onViewportChange}
        onMoveEnd={onMoveEnd}
      >
        <Fab
          aria-label={"add"}
          color={"primary"}
          onClick={userLocationOnClick}
          sx={{
            position: "absolute",
            bottom: theme.spacing(4),
            right: theme.spacing(2),
          }}
        >
          <MyLocationIcon />
        </Fab>
        <Popper open={true}>
          <AssistiveChips />
        </Popper>

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
