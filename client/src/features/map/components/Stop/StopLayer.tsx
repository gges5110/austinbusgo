import * as GeoJSON from "geojson";
import { default as React, useEffect, useMemo, useRef } from "react";
import { Layer, Source, useMap } from "react-map-gl/mapbox";
import { Stop } from "shared/types/interface.d";

interface StopLayerProps {
  readonly selectedStop: Stop | undefined;
  readonly stops: Stop[];

  setSelectedStop(stop: Stop): void;
}

type LayerClickEvent = {
  features?: Array<{ properties: Record<string, unknown> | null }>;
};

export const StopLayer: React.FC<StopLayerProps> = ({
  selectedStop,
  setSelectedStop,
  stops,
}) => {
  const { mapId: map } = useMap();
  // Use a ref so the click handler always sees the latest stops without
  // needing to re-register the event listener on every stops update.
  const stopsRef = useRef(stops);
  useEffect(() => {
    stopsRef.current = stops;
  }, [stops]);

  const stopsGeoJSON = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: stops.map((stop) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: stop.stopLoc?.coordinates ?? [0, 0],
        },
        properties: {
          // Lower number = higher priority (placed first in collision resolution).
          // Stops with more routes win collisions: more routes → lower sort key.
          priority: Math.max(1, 10 - (stop.routes?.length ?? 0)),
          stopId: stop.stopId,
          stopName: stop.stopName ?? "",
        },
      })),
    }),
    [stops],
  );

  useEffect(() => {
    if (!map) return;

    const handleClick = (e: LayerClickEvent) => {
      const stopId = e.features?.[0]?.properties?.["stopId"] as
        | string
        | undefined;
      if (!stopId) return;
      const matched = stopsRef.current.find((s) => s.stopId === stopId);
      if (matched) setSelectedStop(matched);
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on("click", "stop-circles", handleClick as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on("mouseenter", "stop-circles", handleMouseEnter as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on("mouseleave", "stop-circles", handleMouseLeave as any);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.off("click", "stop-circles", handleClick as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.off("mouseenter", "stop-circles", handleMouseEnter as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.off("mouseleave", "stop-circles", handleMouseLeave as any);
    };
  }, [map, setSelectedStop]);

  return (
    <Source data={stopsGeoJSON} id={"stops"} type={"geojson"}>
      {/* Circle layer: WebGL-rendered dots, zoom-gated, selected stop highlighted red */}
      <Layer
        id={"stop-circles"}
        paint={{
          "circle-color": [
            "case",
            ["==", ["get", "stopId"], selectedStop?.stopId ?? ""],
            "#EA4335",
            "#1A73E8",
          ],
          // Hide all stop markers below zoom 11 (avoid clutter at city-wide zoom)
          "circle-opacity": ["step", ["zoom"], 0, 11, 1],
          "circle-radius": 8,
          "circle-stroke-color": "white",
          "circle-stroke-width": 2,
        }}
        type={"circle"}
      />
      {/* Symbol layer: text labels with native Mapbox collision detection.
          symbol-sort-key ensures higher-priority stops (more routes) win
          when labels compete for the same screen space. Labels appear at zoom 14+. */}
      <Layer
        id={"stop-labels"}
        layout={{
          "symbol-sort-key": ["get", "priority"],
          "text-allow-overlap": false,
          "text-anchor": "left",
          "text-field": ["step", ["zoom"], "", 14, ["get", "stopName"]],
          "text-offset": [1.2, 0],
          "text-optional": true,
        }}
        paint={{
          "text-color": "#202124",
          "text-halo-color": "rgba(255, 255, 255, 0.92)",
          "text-halo-width": 2,
          "text-opacity": ["step", ["zoom"], 0, 14, 1],
        }}
        type={"symbol"}
      />
    </Source>
  );
};
