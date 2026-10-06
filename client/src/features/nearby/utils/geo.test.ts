import { describe, expect, test } from "vitest";

import { boundingBox, distanceMeters, formatDistance } from "./geo";

const CONGRESS_7TH = { latitude: 30.2686, longitude: -97.7425 };

describe("distanceMeters", () => {
  test("is zero for the same point", () => {
    expect(distanceMeters(CONGRESS_7TH, CONGRESS_7TH)).toBe(0);
  });

  test("one thousandth of a degree of latitude is ~111 m", () => {
    const north = { ...CONGRESS_7TH, latitude: CONGRESS_7TH.latitude + 0.001 };

    expect(distanceMeters(CONGRESS_7TH, north)).toBeCloseTo(111.2, 0);
  });
});

test("boundingBox reaches the radius in every direction", () => {
  const box = boundingBox(CONGRESS_7TH, 400);

  const corners = {
    north: { ...CONGRESS_7TH, latitude: box.max_lat },
    south: { ...CONGRESS_7TH, latitude: box.min_lat },
    east: { ...CONGRESS_7TH, longitude: box.max_lon },
    west: { ...CONGRESS_7TH, longitude: box.min_lon },
  };
  for (const edge of Object.values(corners)) {
    expect(distanceMeters(CONGRESS_7TH, edge)).toBeCloseTo(400, -1);
  }
});

test.each([
  [42, "40 m"],
  [995, "1.0 km"],
  [1530, "1.5 km"],
])("formatDistance(%d) → %s", (meters, label) => {
  expect(formatDistance(meters)).toBe(label);
});
