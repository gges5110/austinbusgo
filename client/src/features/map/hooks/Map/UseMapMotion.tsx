import { vehicleZoomLevel, ViewState } from "features/map/components/Map/Map";
import { useAtomValue } from "jotai";
import { LngLatBoundsLike } from "mapbox-gl";
import { useEffect } from "react";
import { useMap } from "react-map-gl/mapbox";
import { mapsFlyToCoordinateAtom } from "shared/state/atoms";
import { LineString, Stop } from "shared/types/interface.d";

export const useMapMotion = (
  viewState: ViewState,
  stop: Stop | undefined,
  stops: Stop[],
  routeShapes: LineString[]
) => {
  const { mapId: map } = useMap();
  const mapsFlyToCoordinate = useAtomValue(mapsFlyToCoordinateAtom);
  useEffect(() => {
    if (map && mapsFlyToCoordinate) {
      map.flyTo({
        center: mapsFlyToCoordinate,
      });
    }
  }, [map, mapsFlyToCoordinate]);

  const flyToStop = (stop: Stop) => {
    if (map && stop.stopLoc?.coordinates) {
      const isMobile = window.innerWidth < 768;
      map.flyTo({
        center: [
          stop.stopLoc.coordinates?.[0] || viewState.longitude,
          stop.stopLoc.coordinates?.[1] || viewState.latitude,
        ],
        zoom: vehicleZoomLevel,
        padding: {
          top: 0,
          left: isMobile ? 0 : 420,
          right: 0,
          bottom: 0,
        },
      });
    }
  };

  const flyToRoute = () => {
    if (routeShapes.length === 0) {
      return;
    }

    const flatLineString = routeShapes.flat();
    const coordinates = flatLineString.map((s) => s.coordinates).flat();
    const bounds: LngLatBoundsLike = [
      [
        Math.min(...coordinates.map((coord) => coord[0])),
        Math.min(...coordinates.map((coord) => coord[1])),
      ],
      [
        Math.max(...coordinates.map((coord) => coord[0])),
        Math.max(...coordinates.map((coord) => coord[1])),
      ],
    ];
    const isMobile = window.innerWidth < 768;
    map?.fitBounds(bounds, {
      padding: {
        top: 10,
        left: isMobile ? 0 : 420,
        right: 10,
        bottom: 10,
      },
    });
  };

  const flyToStops = (stops: Stop[]) => {
    if (stops.length === 0) {
      return;
    }

    const bounds: LngLatBoundsLike = [
      [
        Math.min(...stops.map((stop) => stop.stopLoc?.coordinates?.[0] || 0)),
        Math.min(...stops.map((stop) => stop.stopLoc?.coordinates?.[1] || 0)),
      ],
      [
        Math.max(...stops.map((stop) => stop.stopLoc?.coordinates?.[0] || 0)),
        Math.max(...stops.map((stop) => stop.stopLoc?.coordinates?.[1] || 0)),
      ],
    ];

    const isMobile = window.innerWidth < 768;
    map?.fitBounds(bounds, {
      padding: {
        top: 10,
        left: isMobile ? 0 : 420,
        right: 10,
        bottom: 10,
      },
    });
  };

  useEffect(() => {
    if (!map) {
      return;
    }

    if (stop) {
      flyToStop(stop);
    } else if (routeShapes.length !== 0) {
      flyToRoute();
    } else if (stops) {
      flyToStops(stops);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, stop, JSON.stringify(stops), JSON.stringify(routeShapes)]);
};
