import { debounce, useTheme } from "@mui/material";
import Fab from "@mui/material/Fab";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import * as GeoJSON from "geojson";
import { useSnackbar } from "notistack";
import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { VehicleMarker } from "./Vehicle/VehicleMarker";
import { useLocation, useNavigate, useNavigation } from "react-router-dom";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";
import {
  NearByStopsQueryVariables,
  useNearByStopsQuery,
} from "../../schemas/NearByStops.generated";

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
  readonly routeShapes: LineString[];
  readonly stops: Stop[];
  readonly vehiclePositions: VehiclePosition[];

  setSelectedStopId(stopId: string): void;
}

const geojson: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
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
    GeoJSON.FeatureCollection<GeoJSON.LineString>
  >(geojson);

  const setRouteShape = (lineStrings: LineString[]): void => {
    setRouteShapeGeoJSON({
      type: "FeatureCollection",
      features: lineStrings.map((lineString) => ({
        type: "Feature",
        geometry: lineString as GeoJSON.LineString,
        properties: {},
      })),
    });
  };

  const { enqueueSnackbar } = useSnackbar();
  const navigation = useNavigation();
  const location = useLocation();

  const [nearByStopsVariables, setNearByStopsVariables] = useState<
    NearByStopsQueryVariables | undefined
  >();
  const [nearByStops, setNearByStops] = useState<Stop[]>([]);
  useNearByStopsQuery(nearByStopsVariables as NearByStopsQueryVariables, {
    enabled: nearByStopsVariables !== undefined,
    onSuccess: (data) => {
      const stopIds = stops.map((stop) => stop.stopId);
      const filteredNearByStops = data.nearByStops.filter(
        (stop) => !stopIds.includes(stop.stopId)
      );
      setNearByStops(filteredNearByStops);
    },
  });

  const {
    latitude,
    longitude,
    zoom,
    viewStatePathname,
    searchParams,
    restOfPathname,
  } = useViewStatePathname();

  const [viewPort, setViewPort] = useState<ViewState>({
    latitude: latitude || defaultCenter[1],
    longitude: longitude || defaultCenter[0],
    zoom: zoom || 11.5,
  });

  useEffect(() => {
    if (viewStatePathname === "") {
      const path =
        `/@${parseFloat(viewPort.latitude.toFixed(7))},${parseFloat(
          viewPort.longitude.toFixed(7)
        )},${parseFloat(viewPort.zoom.toFixed(2))}z` + searchParams;

      // hack to prevent navigation from failing on component mount
      setTimeout(() => {
        navigate(path);
      });
    }
  }, []);

  const flyToStop = (stop: Stop) => {
    map?.flyTo({
      center: [
        stop.stopLoc?.coordinates?.[0] || viewPort.longitude,
        stop.stopLoc?.coordinates?.[1] || viewPort.latitude,
      ],
      zoom: vehicleZoomLevel,
      padding: {
        top: 0,
        left: 420,
        right: 0,
        bottom: 0,
      },
    });
  };

  const flyToRoute = () => {
    if (routeShapes.length !== 0) {
      const flatLineString = routeShapes.flat();
      const coordinates = flatLineString.map((s) => s.coordinates).flat();
      map?.fitBounds(
        [
          [
            Math.min(...coordinates.map((coord) => coord[0])),
            Math.min(...coordinates.map((coord) => coord[1])),
          ],
          [
            Math.max(...coordinates.map((coord) => coord[0])),
            Math.max(...coordinates.map((coord) => coord[1])),
          ],
        ],
        {
          padding: {
            top: 10,
            left: 420,
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
        path += restOfPathname + searchParams;
      }

      // TODO: prevent quick navigation from infinite loop
      delayedQuery.clear();
      if (navigation.location === undefined) {
        navigate(path, { replace: true });
      }

      setNearByStopsVariables({
        lat: parseFloat(viewState.latitude.toFixed(7)),
        lon: parseFloat(viewState.longitude.toFixed(7)),
      });
    }, 50),
    [location.pathname, navigation.location, restOfPathname, searchParams]
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
  const vehicleMarkers = useMemo(
    () =>
      vehiclePositions.map((vehiclePosition) => (
        <VehicleMarker
          key={vehiclePosition?.vehicle?.id || ""}
          vehiclePosition={vehiclePosition}
          onClick={vehicleMarkerOnClick}
        />
      )),
    [vehiclePositions]
  );

  const stopMarkers = useMemo(
    () => (
      <StopMarkers
        stops={stops}
        setSelectedStop={(stop) => {
          setSelectedStopId(stop.stopId);
        }}
        selectedStop={stop}
      />
    ),
    [stops, stop]
  );

  const nearByStopMarkers = useMemo(
    () => (
      <StopMarkers
        stops={nearByStops}
        setSelectedStop={(stop) => {
          setSelectedStopId(stop.stopId);
        }}
        selectedStop={stop}
      />
    ),
    [nearByStops, stop]
  );

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

        {stopMarkers}
        {nearByStopMarkers}
        {vehicleMarkers}

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
