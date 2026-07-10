import type {
  FeatureCollection,
  GeoJsonProperties,
  Point,
  Position,
} from "geojson";

/**
 * Builds a Point FeatureCollection from a list of items, skipping items
 * without coordinates. Shared by the stop and vehicle layers.
 */
export const toPointFeatureCollection = <T>(
  items: T[],
  getCoordinates: (item: T) => Position | undefined,
  getProperties: (item: T) => GeoJsonProperties
): FeatureCollection<Point> => ({
  type: "FeatureCollection",
  features: items.flatMap((item) => {
    const coordinates = getCoordinates(item);
    if (!coordinates) return [];
    return [
      {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates },
        properties: getProperties(item),
      },
    ];
  }),
});
