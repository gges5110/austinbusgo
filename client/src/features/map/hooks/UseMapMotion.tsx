import { useAtomValue } from "jotai";
import { LngLatBoundsLike } from "mapbox-gl";
import { useEffect } from "react";
import { useMap } from "react-map-gl/mapbox";
import { mapsFlyToCoordinateAtom } from "shared/state/atoms";
import { LineString, Stop } from "shared/types/interface.d";

export const useMapMotion = (stops: Stop[], routeShapes: LineString[]) => {
  const { mapId: map } = useMap();
  const mapsFlyToCoordinate = useAtomValue(mapsFlyToCoordinateAtom);
  // Atom-driven flyTo: triggered when a user selects a stop (via map marker click,
  // search, RouteStopsTimeline, or TripTimeline), which set mapsFlyToCoordinateAtom.
  useEffect(() => {
    if (map && mapsFlyToCoordinate) {
      map.flyTo({
        center: mapsFlyToCoordinate,
      });
    }
  }, [map, mapsFlyToCoordinate]);

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

  // Limitation: map motion is an imperative action (stop selected, route loaded) but
  // useEffect models it as a state reaction. A cleaner approach would be to call
  // flyTo/fitBounds imperatively at the event site (click handlers, data-load callbacks).
  useEffect(() => {
    if (!map) {
      return;
    }

    if (routeShapes.length !== 0) {
      // User navigated to a route — fit the entire route shape in view
      flyToRoute();
    } else if (stops) {
      // Search results loaded — fit all matching stops in view
      flyToStops(stops);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(stops), JSON.stringify(routeShapes)]);
};
