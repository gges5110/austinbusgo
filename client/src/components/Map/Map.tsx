import { useTheme } from "@mui/material";
import Fab from "@mui/material/Fab";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import * as GeoJSON from "geojson";
import { useSnackbar } from "notistack";
import * as React from "react";
import { useEffect, useState } from "react";
import ReactMapGL, {
  Layer,
  Source,
  useMap,
  ViewStateChangeEvent,
} from "react-map-gl";
import { Route, Stop, VehiclePosition } from "../../interfaces/interface.d";
import { ShapeData } from "../../interfaces/Shape";
import { StopMarkers } from "./Stop/StopMarkers";
import { VehicleMarker } from "./Vehicle/VehicleMarker";

type ViewState = {
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
  readonly routeShapes: ShapeData[][];
  readonly stops: Stop[];
  readonly vehiclePositions: VehiclePosition[];
  setSelectedStopId(stopId: number): void;
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

export const Map: React.FunctionComponent<MapProps> = ({
  route,
  stops,
  stop,
  setSelectedStopId,
  routeShapes,
  vehiclePositions,
}) => {
  const { mapId: map } = useMap();

  const [routeShapeGeoJSON, setRouteShapeGeoJSON] = useState<
    GeoJSON.FeatureCollection<GeoJSON.Geometry>
  >(geojson);

  const setRouteShape = (shapeDataList: ShapeData[][]): void => {
    setRouteShapeGeoJSON({
      type: "FeatureCollection",
      features: shapeDataList.map((shapeDatas) => {
        return {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: shapeDatas.map(
              (shapeData) =>
                [shapeData.shapePtLon, shapeData.shapePtLat] as Coordinate
            ),
          },
          properties: {},
        };
      }),
    });
  };

  const { enqueueSnackbar } = useSnackbar();

  const [viewPort, setViewPort] = useState<ViewState>({
    latitude: defaultCenter[1],
    longitude: defaultCenter[0],
    zoom: 11.5,
  });

  const flyToStop = (stop: Stop) => {
    map?.flyTo({
      center: [
        stop.stopLon || viewPort.longitude,
        stop.stopLat || viewPort.latitude,
      ],
      zoom: vehicleZoomLevel,
    });
  };

  const flyToRoute = () => {
    if (routeShapes.length !== 0) {
      const flatShapes = routeShapes.flat();
      map?.fitBounds(
        [
          [
            Math.min(...flatShapes.map((routeShape) => routeShape.shapePtLon)),
            Math.min(...flatShapes.map((routeShape) => routeShape.shapePtLat)),
          ],
          [
            Math.max(...flatShapes.map((routeShape) => routeShape.shapePtLon)),
            Math.max(...flatShapes.map((routeShape) => routeShape.shapePtLat)),
          ],
        ],
        {
          padding: {
            top: 80,
            left: 640,
            right: 80,
            bottom: 80,
          },
        }
      );
    }
  };

  useEffect(() => {
    if (stop) {
      flyToStop(stop);
    } else {
      flyToRoute();
    }
  }, [stop]);

  useEffect(() => {
    if (routeShapes.length !== 0) {
      flyToRoute();

      setRouteShape(routeShapes);
    } else {
      setRouteShape([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(routeShapes)]);

  const onViewportChange = (event: ViewStateChangeEvent) => {
    setViewPort(event.viewState);
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
  const theme = useTheme();
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
          sx={{
            position: "absolute",
            bottom: theme.spacing(4),
            right: theme.spacing(2),
          }}
          onClick={useUserLocation}
        >
          <MyLocationIcon />
        </Fab>
        <StopMarkers
          stops={stops}
          setSelectedStop={(stop) => {
            setSelectedStopId(stop.stopId);
          }}
          direction={false}
        />

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
              "line-color": `#${route?.routeColor || "a5a5a5"}`,
              "line-width": 5,
            }}
          />
        </Source>
      </ReactMapGL>
    </>
  );
};
