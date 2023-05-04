import { debounce, useTheme } from "@mui/material";
import Fab from "@mui/material/Fab";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import * as GeoJSON from "geojson";
import { useSnackbar } from "notistack";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
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
import { useLocation, useNavigate, useNavigation } from "react-router-dom";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";

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

const vehicleZoomLevel = 16;
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
  const navigate = useNavigate();
  const theme = useTheme();

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
  const navigation = useNavigation();
  const location = useLocation();
  const re = /^(\/@[-0-9.]+,[-0-9.]+,[0-9.]+z)(.*)/;

  const {
    latitude,
    longitude,
    zoom,
    viewStatePathname,
    restOfPathname,
  } = useViewStatePathname();

  const [viewPort, setViewPort] = useState<ViewState>({
    latitude: latitude || defaultCenter[1],
    longitude: longitude || defaultCenter[0],
    zoom: zoom || 11.5,
  });

  useEffect(() => {
    if (viewStatePathname === "") {
      const path = `/@${parseFloat(viewPort.latitude.toFixed(7))},${parseFloat(
        viewPort.longitude.toFixed(7)
      )},${parseFloat(viewPort.zoom.toFixed(2))}z`;

      // hack to prevent navigation from failing on component mount
      setTimeout(() => {
        navigate(path);
      });
    }
  }, []);

  const flyToStop = (stop: Stop) => {
    map?.flyTo({
      center: [
        stop.stopLon || viewPort.longitude,
        stop.stopLat || viewPort.latitude,
      ],
      zoom: vehicleZoomLevel,
      padding: {
        top: 0,
        left: 400,
        right: 0,
        bottom: 0,
      },
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
            top: 10,
            left: 10,
            right: 10,
            bottom: 10,
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

  const delayedQuery = useCallback(
    debounce((viewState: ViewState) => {
      let path = `/@${parseFloat(viewState.latitude.toFixed(7))},${parseFloat(
        viewState.longitude.toFixed(7)
      )},${parseFloat(viewState.zoom.toFixed(2))}z`;
      if (restOfPathname !== "" && restOfPathname !== undefined) {
        path += restOfPathname;
      }

      // TODO: prevent quick navigation from infinite loop
      delayedQuery.clear();
      if (navigation.location === undefined) {
        navigate(path, { replace: true });
      }
    }, 50),
    [location.pathname, navigation.location, restOfPathname]
  );

  const onViewportChange = (event: ViewStateChangeEvent) => {
    setViewPort(event.viewState);
  };

  const onMoveEnd = (event: ViewStateChangeEvent) => {
    delayedQuery(event.viewState);
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
      enqueueSnackbar("Retrieving current location...", {
        variant: "info",
      });

      const geoSuccess: PositionCallback = (position) => {
        enqueueSnackbar("Location obtained", {
          variant: "success",
        });

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
        mapStyle={
          theme.palette.mode === "dark"
            ? "mapbox://styles/mapbox/dark-v11"
            : "mapbox://styles/mapbox/streets-v12"
        }
        onMove={onViewportChange}
        onMoveEnd={onMoveEnd}
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
          selectedStop={stop}
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
