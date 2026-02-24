const DEFAULT_LATITUDE = 30.2672;
const DEFAULT_LONGITUDE = -97.7431;
const DEFAULT_ZOOM = 11.5;

export type ViewStateBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  limit: number;
};

export function parseViewStateFromPathname(pathname: string): {
  latitude: number;
  longitude: number;
  zoom: number;
} {
  const match = pathname.match(/@([-0-9.]+),([-0-9.]+),([0-9.]+)z/);
  return {
    latitude: match?.[1] ? Number(match[1]) : DEFAULT_LATITUDE,
    longitude: match?.[2] ? Number(match[2]) : DEFAULT_LONGITUDE,
    zoom: match?.[3] ? Number(match[3]) : DEFAULT_ZOOM,
  };
}

/**
 * Computes approximate map bounding box from a view state and viewport size.
 * Uses Web Mercator math matching Mapbox GL's tile size (512px).
 */
export function computeBoundsFromViewState(
  latitude: number,
  longitude: number,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number
): ViewStateBounds {
  const TILE_SIZE = 512;
  const lonPerPixel = 360 / (TILE_SIZE * Math.pow(2, zoom));
  const latPerPixel = lonPerPixel * Math.cos((latitude * Math.PI) / 180);

  const limit = zoom <= 11 ? 40 : zoom <= 14 ? 80 : 100;

  return {
    minLat: latitude - (viewportHeight / 2) * latPerPixel,
    maxLat: latitude + (viewportHeight / 2) * latPerPixel,
    minLon: longitude - (viewportWidth / 2) * lonPerPixel,
    maxLon: longitude + (viewportWidth / 2) * lonPerPixel,
    limit,
  };
}
