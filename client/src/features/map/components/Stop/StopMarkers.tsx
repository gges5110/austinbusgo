import type { MapLayerMouseEvent } from "mapbox-gl";
import { useAtomValue } from "jotai";
import * as GeoJSON from "geojson";
import { default as React, useCallback, useEffect, useMemo } from "react";
import { Layer, Marker, Source, useMap } from "react-map-gl/mapbox";
import { hoveringStopAtom } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

import { StopPin } from "./StopPin";

interface StopMarkersProps {
  readonly selectedStop: Stop | undefined;
  readonly stops: Stop[];

  setSelectedStop(stop: Stop): void;
}

const ICON_NORMAL = "stop-icon";
const ICON_HOVER = "stop-icon-hover";
const LAYER_ID = "stop-icons";
const ICON_SIZE = 24;

function createCircleIcon(color: string, size: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new ImageData(size, size);
  const center = size / 2;
  const radius = size / 2 - 2;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

export const StopMarkers: React.FC<StopMarkersProps> = ({
  selectedStop,
  setSelectedStop,
  stops,
}) => {
  const { mapId: map } = useMap();
  const hoveringStop = useAtomValue(hoveringStopAtom);

  // Register custom stop icons; re-register after style changes (e.g. dark/light mode switch)
  useEffect(() => {
    if (!map) return;

    const registerImages = () => {
      if (!map.hasImage(ICON_NORMAL)) {
        map.addImage(ICON_NORMAL, createCircleIcon("#1A73E8", ICON_SIZE));
      }
      if (!map.hasImage(ICON_HOVER)) {
        map.addImage(ICON_HOVER, createCircleIcon("#EA4335", ICON_SIZE));
      }
    };

    if (map.isStyleLoaded()) {
      registerImages();
    }
    map.on("styledata", registerImages);

    return () => {
      map.off("styledata", registerImages);
    };
  }, [map]);

  // Convert stops to GeoJSON; exclude selected stop (rendered separately as DOM Marker)
  const stopsGeoJSON = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: stops
        .filter(
          (stop) =>
            stop.stopLoc?.coordinates &&
            stop.stopId !== selectedStop?.stopId
        )
        .map((stop) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: stop.stopLoc!.coordinates as [number, number],
          },
          properties: {
            isHovering: stop.stopId === hoveringStop?.stopId,
            // More routes served = lower sort key number = placed first = wins collisions
            priority: Math.max(1, 10 - (stop.routes?.length ?? 0)),
            stopId: stop.stopId,
            stopName: stop.stopName ?? "",
          },
        })),
    }),
    [hoveringStop, selectedStop, stops]
  );

  const handleLayerClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const stopId = feature?.properties?.stopId as string | undefined;
      if (!stopId) return;
      const clicked = stops.find((s) => s.stopId === stopId);
      if (clicked) setSelectedStop(clicked);
    },
    [setSelectedStop, stops]
  );

  useEffect(() => {
    if (!map) return;

    const setCursorPointer = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const resetCursor = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", LAYER_ID, handleLayerClick);
    map.on("mouseenter", LAYER_ID, setCursorPointer);
    map.on("mouseleave", LAYER_ID, resetCursor);

    return () => {
      map.off("click", LAYER_ID, handleLayerClick);
      map.off("mouseenter", LAYER_ID, setCursorPointer);
      map.off("mouseleave", LAYER_ID, resetCursor);
    };
  }, [handleLayerClick, map]);

  return (
    <>
      <Source data={stopsGeoJSON} id="stops" type="geojson">
        <Layer
          id={LAYER_ID}
          layout={{
            "icon-allow-overlap": false,
            "icon-image": [
              "case",
              ["get", "isHovering"],
              ICON_HOVER,
              ICON_NORMAL,
            ],
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10,
              0.6,
              14,
              1.0,
              18,
              1.4,
            ],
            "symbol-sort-key": ["get", "priority"],
            "text-allow-overlap": false,
            "text-field": ["step", ["zoom"], "", 14, ["get", "stopName"]],
            "text-offset": [0, 1.5],
            "text-optional": true,
            "text-size": 12,
          }}
          paint={{
            "icon-opacity": ["step", ["zoom"], 0, 11, 1],
            "text-color": "#202124",
            "text-halo-color": "rgba(255, 255, 255, 0.9)",
            "text-halo-width": 1,
          }}
          type="symbol"
        />
      </Source>
      {/* Selected stop rendered as a DOM Marker so it always appears above the collision layer */}
      {selectedStop?.stopLoc?.coordinates && (
        <Marker
          latitude={selectedStop.stopLoc.coordinates[1]}
          longitude={selectedStop.stopLoc.coordinates[0]}
        >
          <StopPin
            highlighted={true}
            onClick={() => {}}
            stopName={selectedStop.stopName ?? ""}
          />
        </Marker>
      )}
    </>
  );
};
