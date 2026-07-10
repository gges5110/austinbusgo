import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { MapRef, useMap } from "react-map-gl/mapbox";
import { mapsFlyToCoordinateAtom } from "shared/state/atoms";
import { LineString, Stop } from "shared/types/interface.d";

/**
 * Fits the map view to a set of [lon, lat] coordinates, leaving room for the
 * sidebar on desktop. No-op when the list is empty.
 */
const fitToCoordinates = (
  map: MapRef,
  coordinates: number[][],
  options: { maxZoom?: number } = {}
) => {
  if (coordinates.length === 0) return;

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of coordinates) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }

  const isMobile = window.innerWidth < 768;
  map.fitBounds(
    [
      [minLon, minLat],
      [maxLon, maxLat],
    ],
    {
      ...options,
      padding: {
        top: 10,
        left: isMobile ? 0 : 420,
        right: 10,
        bottom: 10,
      },
    }
  );
};

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

  // Limitation: map motion is an imperative action (stop selected, route loaded) but
  // useEffect models it as a state reaction. A cleaner approach would be to call
  // flyTo/fitBounds imperatively at the event site (click handlers, data-load callbacks).
  // `stops` and `routeShapes` must be referentially stable between data changes
  // (see useStops / useRouteShapes) or the map re-fits on every render.
  useEffect(() => {
    if (!map) return;

    if (routeShapes.length > 0) {
      // User navigated to a route — fit the entire route shape in view
      fitToCoordinates(
        map,
        routeShapes.flatMap((shape) => shape.coordinates)
      );
    } else {
      // Search results loaded — fit all matching stops in view
      fitToCoordinates(
        map,
        stops.flatMap((stop) =>
          stop.stopLoc?.coordinates ? [stop.stopLoc.coordinates] : []
        ),
        { maxZoom: 16 }
      );
    }
  }, [map, stops, routeShapes]);
};
