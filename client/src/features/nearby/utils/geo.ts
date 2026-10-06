export interface LatLon {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6371008.8;
const METERS_PER_DEGREE_LAT = 111195;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle (haversine) distance in meters. */
export const distanceMeters = (a: LatLon, b: LatLon) => {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) *
      Math.cos(toRadians(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
};

/** Bounding box reaching `meters` from the center in each direction. */
export const boundingBox = (center: LatLon, meters: number) => {
  const dLat = meters / METERS_PER_DEGREE_LAT;
  const dLon =
    meters / (METERS_PER_DEGREE_LAT * Math.cos(toRadians(center.latitude)));
  return {
    min_lat: center.latitude - dLat,
    max_lat: center.latitude + dLat,
    min_lon: center.longitude - dLon,
    max_lon: center.longitude + dLon,
  };
};

/** "40 m" / "1.2 km" */
export const formatDistance = (meters: number) => {
  // Round first so 995 m reads "1.0 km", not "1000 m"
  const rounded = Math.round(meters / 10) * 10;
  return rounded < 1000 ? `${rounded} m` : `${(meters / 1000).toFixed(1)} km`;
};
