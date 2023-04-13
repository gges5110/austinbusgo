import { createStyles, Theme } from "@material-ui/core";
import Fab from "@material-ui/core/Fab";
import makeStyles from "@material-ui/core/styles/makeStyles";
import MyLocationIcon from "@material-ui/icons/MyLocation";
import * as GeoJSON from "geojson";
import { useSnackbar } from "notistack";
import * as React from "react";
import { useEffect, useState } from "react";
import ReactMapGL, {
  Layer,
  Source,
  ViewportChangeHandler,
  ViewState,
  WebMercatorViewport,
} from "react-map-gl";
import {
  ArrivalTime,
  RunningTrip,
  Stop,
  VehiclePosition,
} from "../../interfaces/interface.d";
import { ShapeData } from "../../interfaces/Shape";
import { SearchPanel } from "../SearchPanel";
import { StopDrawer } from "./Stop/StopDrawer";
import { StopMarkers } from "./Stop/StopMarkers";
import { VehicleMarker } from "./Vehicle/VehicleMarker";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      position: "absolute",
      bottom: theme.spacing(4),
      right: theme.spacing(2),
    },
  })
);

interface MapProps {
  readonly trip?: RunningTrip;
  readonly routeShapes: ShapeData[];
  readonly stops: Stop[];
  readonly vehiclePositions: VehiclePosition[];
  readonly runningTrips: RunningTrip[];
  readonly loading?: boolean;
  setTrip(trip?: RunningTrip): void;
  openSettingsDialog(): void;
}

export const iconSize = {
  width: 24,
  height: 24,
};

const geojson: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [],
      },
      properties: {},
    },
  ],
};

const vehicleZoomLevel = 15;
const defaultCenter: Coordinate = [-97.7431, 30.2672];
export declare type Coordinate = [number, number];

export const Map: React.FunctionComponent<MapProps> = ({
  trip,
  stops,
  routeShapes,
  vehiclePositions,
  runningTrips,
  loading,
  setTrip,
  openSettingsDialog,
}) => {
  const classes = useStyles();

  const [routeShapeGeoJSON, setRouteShapeGeoJSON] = useState<
    GeoJSON.FeatureCollection<GeoJSON.Geometry>
  >(geojson);

  const setRouteShape = (coords: Coordinate[]): void => {
    setRouteShapeGeoJSON({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coords,
          },
          properties: {},
        },
      ],
    });
  };

  const { enqueueSnackbar } = useSnackbar();

  const [viewPort, setViewPort] = useState<ViewState>({
    latitude: defaultCenter[1],
    longitude: defaultCenter[0],
    zoom: 11.5,
  });

  const setViewPortWithTransition = (viewState: ViewState) => {
    setViewPort({
      ...viewState,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      transitionDuration: 500,
    });
  };

  useEffect(() => {
    if (routeShapes.length !== 0) {
      setRouteShape(
        routeShapes.map(
          (routeShape: ShapeData) =>
            [routeShape.shapePtLon, routeShape.shapePtLat] as Coordinate
        )
      );

      // Reference: https://github.com/uber-archive/viewport-mercator-project/blob/master/docs/api-reference/web-mercator-viewport.md
      const newViewport = new WebMercatorViewport(viewPort).fitBounds(
        [
          [
            Math.min(...routeShapes.map((routeShape) => routeShape.shapePtLon)),
            Math.min(...routeShapes.map((routeShape) => routeShape.shapePtLat)),
          ],
          [
            Math.max(...routeShapes.map((routeShape) => routeShape.shapePtLon)),
            Math.max(...routeShapes.map((routeShape) => routeShape.shapePtLat)),
          ],
        ],
        {
          padding: 80,
        }
      );

      setViewPortWithTransition({
        ...newViewport,
      });
    } else {
      setRouteShape([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(routeShapes)]);

  const [selectedStop, setSelectedStop] = useState<Stop | undefined>(undefined);

  const closeStopDrawer = (): void => {
    setSelectedStop(undefined);
  };

  const onViewportChange: ViewportChangeHandler = (viewState) => {
    setViewPort(viewState);
  };

  const arrivalTimeOnClick = (arrivalTime: ArrivalTime) => {
    setViewPortWithTransition({
      ...viewPort,
      latitude: arrivalTime.vehicle.position?.latitude || viewPort.latitude,
      longitude: arrivalTime.vehicle.position?.longitude || viewPort.longitude,
      zoom: vehicleZoomLevel,
    });

    setSelectedStop(undefined);
  };

  const vehicleMarkerOnClick = (vehicle: VehiclePosition) => {
    setViewPortWithTransition({
      ...viewPort,
      latitude: vehicle.position?.latitude || viewPort.latitude,
      longitude: vehicle.position?.longitude || viewPort.longitude,
    });
  };

  const useUserLocation = () => {
    if (navigator.geolocation) {
      const geoSuccess: PositionCallback = (position) => {
        setViewPortWithTransition({
          ...viewPort,
          latitude: position.coords.latitude || viewPort.latitude,
          longitude: position.coords.longitude || viewPort.longitude,
        });
      };
      const geoError: PositionErrorCallback = (error) => {
        console.log("Error occurred. Error code: " + error.code);
        if (error.PERMISSION_DENIED) {
          enqueueSnackbar("Permission denied. Please update the permission.", {
            variant: "warning",
          });
        }
      };
      navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
    } else {
      console.log("Geolocation is not supported for this Browser/OS.");
    }
  };

  return (
    <ReactMapGL
      {...viewPort}
      width={"100%"}
      height={"100%"}
      style={{ zIndex: 1 }}
      mapStyle={"mapbox://styles/mapbox/streets-v9"}
      onViewportChange={onViewportChange}
    >
      <SearchPanel
        runningTrips={runningTrips}
        setTrip={setTrip}
        trip={trip}
        loading={loading}
        openSettingsDialog={openSettingsDialog}
      />
      <Fab
        color="primary"
        aria-label="add"
        className={classes.fab}
        onClick={useUserLocation}
      >
        <MyLocationIcon />
      </Fab>
      <StopMarkers
        stops={stops}
        setSelectedStop={setSelectedStop}
        direction={trip?.direction || false}
      />

      {trip && selectedStop && (
        <StopDrawer
          stop={selectedStop}
          runningTrip={trip}
          arrivalTimeOnClick={arrivalTimeOnClick}
          open={selectedStop !== null}
          onClose={closeStopDrawer}
        />
      )}

      {
        // Render Bus Vehicle Marker
        vehiclePositions.map((vehiclePosition) => (
          <VehicleMarker
            key={vehiclePosition?.vehicle?.id || ""}
            vehiclePosition={vehiclePosition}
            onClick={vehicleMarkerOnClick}
          />
        ))
      }

      <Source id="my-data" type="geojson" data={routeShapeGeoJSON}>
        <Layer
          id="point"
          type="line"
          paint={{
            "line-color": `#${trip?.color || "a5a5a5"}`,
            "line-width": 5,
          }}
        />
      </Source>
    </ReactMapGL>
  );
};
