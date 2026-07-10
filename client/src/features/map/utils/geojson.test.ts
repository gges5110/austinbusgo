import { describe, expect, test } from "vitest";

import { toPointFeatureCollection } from "./geojson";

interface Item {
  id: string;
  coords?: [number, number];
}

const getCoordinates = (item: Item) => item.coords;
const getProperties = (item: Item) => ({ id: item.id });

describe("toPointFeatureCollection", () => {
  test("builds point features with properties", () => {
    const items: Item[] = [
      { id: "a", coords: [-97.7, 30.2] },
      { id: "b", coords: [-97.8, 30.3] },
    ];

    const fc = toPointFeatureCollection(items, getCoordinates, getProperties);

    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(2);
    expect(fc.features[0]).toEqual({
      type: "Feature",
      geometry: { type: "Point", coordinates: [-97.7, 30.2] },
      properties: { id: "a" },
    });
  });

  test("skips items without coordinates", () => {
    const items: Item[] = [
      { id: "a", coords: [-97.7, 30.2] },
      { id: "no-coords" },
    ];

    const fc = toPointFeatureCollection(items, getCoordinates, getProperties);

    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].properties).toEqual({ id: "a" });
  });

  test("returns empty collection for empty input", () => {
    const fc = toPointFeatureCollection([], getCoordinates, getProperties);

    expect(fc.features).toEqual([]);
  });
});
