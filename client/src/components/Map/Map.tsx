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
  MapProvider,
  Source,
  useMap,
  ViewStateChangeEvent,
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
import "./Map.css";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      position: "absolute",
      bottom: theme.spacing(4),
      right: theme.spacing(2),
    },
  })
);

type ViewState = {
  /** Longitude at map center */
  longitude: number;
  /** Latitude at map center */
  latitude: number;
  /** Map zoom level */
  zoom: number;
};

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

const Map: React.FunctionComponent<MapProps> = ({
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
  const { mapId: map } = useMap();

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

  useEffect(() => {
    if (routeShapes.length !== 0) {
      setRouteShape(
        routeShapes.map(
          (routeShape: ShapeData) =>
            [routeShape.shapePtLon, routeShape.shapePtLat] as Coordinate
        )
      );

      map?.fitBounds(
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
        { padding: 80 }
      );
    } else {
      setRouteShape([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(routeShapes)]);

  const [selectedStop, setSelectedStop] = useState<Stop | undefined>(undefined);

  const closeStopDrawer = (): void => {
    setSelectedStop(undefined);
  };

  const onViewportChange = (event: ViewStateChangeEvent) => {
    setViewPort(event.viewState);
  };

  const arrivalTimeOnClick = (arrivalTime: ArrivalTime) => {
    map?.flyTo({
      center: [
        arrivalTime.vehicle.position?.longitude || viewPort.longitude,
        arrivalTime.vehicle.position?.latitude || viewPort.latitude,
      ],
      zoom: vehicleZoomLevel,
    });

    setSelectedStop(undefined);
  };

  const vehicleMarkerOnClick = (vehicle: VehiclePosition) => {
    map?.flyTo({
      center: [
        vehicle.position?.longitude || viewPort.longitude,
        vehicle.position?.latitude || viewPort.latitude,
      ],
      zoom: vehicleZoomLevel,
    });
  };

  const useUserLocation = () => {
    if (navigator.geolocation) {
      const geoSuccess: PositionCallback = (position) => {
        map?.flyTo({
          center: [
            position.coords.longitude || viewPort.longitude,
            position.coords.latitude || viewPort.latitude,
          ],
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
    <>
      <ReactMapGL
        id="mapId"
        {...viewPort}
        mapStyle={"mapbox://styles/mapbox/streets-v9"}
        onMove={onViewportChange}
      >
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

        <Source id="route-shapes" type="geojson" data={routeShapeGeoJSON}>
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
      <div className="map-overlay-container">
        <div className="map-overlay">
          <SearchPanel
            runningTrips={runningTrips}
            setTrip={setTrip}
            trip={trip}
            loading={loading}
            openSettingsDialog={openSettingsDialog}
          />
        </div>
      </div>
    </>
  );
};

export const MapWrapper: React.FunctionComponent<MapProps> = ({
  trip,
  stops,
  routeShapes,
  vehiclePositions,
  runningTrips,
  loading,
  setTrip,
  openSettingsDialog,
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
      openSettingsDialog={openSettingsDialog}
    />
  </MapProvider>
);
