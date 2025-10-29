import * as GeoJSON from "geojson";
import { useEffect, useState } from "react";
import { LineString } from "shared/types/interface.d";

export const useRouteShape = (routeShapes: LineString[]) => {
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

  const [routeShapeGeoJSON, setRouteShapeGeoJSON] =
    useState<GeoJSON.FeatureCollection<GeoJSON.LineString>>(geojson);

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

  useEffect(() => {
    if (routeShapes.length !== 0) {
      setRouteShape(routeShapes);
    } else {
      setRouteShape([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(routeShapes)]);

  return { routeShapeGeoJSON };
};
