import { boundingBox, distanceMeters, LatLon } from "features/nearby/utils/geo";
import { useEffect, useMemo, useState } from "react";
import { useNearByStops } from "shared/api/generated/api";
import { Stop } from "shared/api/generated/model";

/** A 5-minute walk */
export const NEARBY_RADIUS_METERS = 400;
/**
 * About a 20-minute walk: searched on its own when nothing is within a
 * 5-minute walk. Nothing here either usually means outside the service area.
 */
export const WIDE_RADIUS_METERS = 1500;
/**
 * The rider must move this far before the nearest stop is recomputed, so GPS
 * jitter between two close stops (opposite sides of a street) never flips
 * the screen back and forth.
 */
export const RESELECT_DISTANCE_METERS = 75;
const MAX_ALTERNATES = 4;

export interface StopWithDistance {
  stop: Stop;
  distance: number;
}

/**
 * The position the nearest-stop search is anchored to. Moves only once the
 * rider is RESELECT_DISTANCE_METERS away from the previous anchor.
 */
export const useStableAnchor = (position?: LatLon) => {
  const [anchor, setAnchor] = useState<LatLon | undefined>(position);
  if (
    position &&
    (!anchor || distanceMeters(anchor, position) > RESELECT_DISTANCE_METERS)
  ) {
    setAnchor(position);
  }
  return anchor;
};

export const sortByDistance = (
  stops: Stop[],
  from: LatLon
): StopWithDistance[] =>
  stops
    .filter((stop) => stop.stopLoc?.coordinates)
    .map((stop) => {
      const [longitude, latitude] = stop.stopLoc!.coordinates;
      return { stop, distance: distanceMeters(from, { latitude, longitude }) };
    })
    .sort((a, b) => a.distance - b.distance);

/**
 * The stop closest to the rider plus a few alternates (e.g. the other side
 * of the street). Searches a 5-minute walk first (a small box keeps the
 * closest stops in the results); finding nothing, it widens to
 * WIDE_RADIUS_METERS, so riders always get their closest stop.
 */
export const useNearestStop = (position?: LatLon) => {
  const anchor = useStableAnchor(position);
  // The anchor the wide search is for; a new anchor starts narrow again
  const [wideFor, setWideFor] = useState<LatLon>();
  const wide = !!anchor && wideFor === anchor;
  const radius = wide ? WIDE_RADIUS_METERS : NEARBY_RADIUS_METERS;
  const box = anchor ? boundingBox(anchor, radius) : undefined;
  const { data, isLoading, isError } = useNearByStops(
    {
      ...(box ?? { min_lat: 0, max_lat: 0, min_lon: 0, max_lon: 0 }),
      limit: 40,
    },
    { query: { enabled: !!box, staleTime: 5 * 60 * 1000 } }
  );

  const ranked = useMemo(
    () => (anchor && data ? sortByDistance(data, anchor) : []),
    [anchor, data]
  );

  // Nothing within a 5-minute walk: look farther
  const widen =
    !!anchor &&
    !wide &&
    !isLoading &&
    !isError &&
    !!data &&
    ranked.length === 0;
  useEffect(() => {
    if (widen) setWideFor(anchor);
  }, [widen, anchor]);

  return {
    nearest: ranked[0],
    alternates: ranked.slice(1, 1 + MAX_ALTERNATES),
    // Still searching while about to widen, so "no stops" isn't flashed
    isLoading: !!box && (isLoading || widen),
    isError,
  };
};
