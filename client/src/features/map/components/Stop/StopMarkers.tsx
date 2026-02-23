import * as GeoJSON from "geojson";
import { useAtomValue } from "jotai";
import type { MapLayerMouseEvent } from "mapbox-gl";
import * as React from "react";
import { useEffect, useMemo } from "react";
import { Layer, Marker, Source, useMap } from "react-map-gl/mapbox";
import { hoveringStopAtom } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

import { StopPin } from "./StopPin";

const STOP_ICON_ID = "bus-stop-icon";
const STOP_LAYER_ID = "stop-markers-layer";

interface StopMarkersProps {
  readonly stops: Stop[];
  readonly selectedStop: Stop | undefined;

  setSelectedStop(stop: Stop): void;
}

function createBusStopIconData(): {
  width: number;
  height: number;
  data: Uint8Array;
} {
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = "#1A73E8";
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, size, size);
  return { width: size, height: size, data: imageData.data };
}

export const StopMarkers: React.FC<StopMarkersProps> = ({
  stops,
  setSelectedStop,
  selectedStop,
}) => {
  const { mapId: map } = useMap();
  const hoveringStop = useAtomValue(hoveringStopAtom);

  // Register custom bus stop icon with the map, and re-register on style reload
  useEffect(() => {
    if (!map) return;

    const addIcon = () => {
      if (!map.hasImage(STOP_ICON_ID)) {
        const icon = createBusStopIconData();
        map.addImage(STOP_ICON_ID, icon);
      }
    };

    if (map.isStyleLoaded()) {
      addIcon();
    }

    map.on("style.load", addIcon);
    return () => {
      map.off("style.load", addIcon);
    };
  }, [map]);

  // Register click and cursor handlers for the stop layer
  useEffect(() => {
    if (!map) return;

    const handleClick = (e: MapLayerMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: [STOP_LAYER_ID],
      });
      if (features.length > 0) {
        const stopId = features[0].properties?.stopId as string;
        const stop = stops.find((s) => s.stopId === stopId);
        if (stop) {
          setSelectedStop(stop);
        }
      }
    };

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", STOP_LAYER_ID, handleClick);
    map.on("mouseenter", STOP_LAYER_ID, handleMouseEnter);
    map.on("mouseleave", STOP_LAYER_ID, handleMouseLeave);

    return () => {
      map.off("click", STOP_LAYER_ID, handleClick);
      map.off("mouseenter", STOP_LAYER_ID, handleMouseEnter);
      map.off("mouseleave", STOP_LAYER_ID, handleMouseLeave);
    };
  }, [map, stops, setSelectedStop]);

  // Convert stops to a GeoJSON FeatureCollection.
  // Stops that are currently selected or hovered are rendered as <Marker>
  // components (for custom highlighted HTML), so they are excluded here.
  const stopsGeoJSON = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: stops
        .filter(
          (stop) =>
            stop.stopLoc?.coordinates != null &&
            stop.stopId !== selectedStop?.stopId &&
            stop.stopId !== hoveringStop?.stopId
        )
        .map((stop) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: stop.stopLoc!.coordinates,
          },
          properties: {
            stopId: stop.stopId,
            stopName: stop.stopName ?? "",
            stopCode: stop.stopCode ?? "",
            // Lower value = placed first = wins collision resolution.
            // More routes serving a stop means higher priority (lower number).
            priority: Math.max(1, 10 - (stop.routes?.length ?? 0)),
          },
        })),
    }),
    [stops, selectedStop, hoveringStop]
  );

  return (
    <>
      {/* Render all unselected stops via a WebGL symbol layer with native
          collision detection. Mapbox automatically hides overlapping symbols
          and fades them in/out as you zoom — the Google Maps-like behaviour. */}
      <Source data={stopsGeoJSON} id={"stops-source"} type={"geojson"}>
        <Layer
          id={STOP_LAYER_ID}
          layout={{
            "icon-allow-overlap": false,
            "icon-image": STOP_ICON_ID,
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
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-offset": [0, 1.5],
            "text-optional": true,
            "text-size": 12,
          }}
          paint={{
            "icon-opacity": ["step", ["zoom"], 0, 11, 1],
            "text-color": "#202124",
            "text-halo-color": "rgba(255, 255, 255, 0.9)",
            "text-halo-width": 1.5,
          }}
          type={"symbol"}
        />
      </Source>

      {/* Selected stop: rendered as a highlighted HTML Marker */}
      {selectedStop?.stopLoc?.coordinates && (
        <Marker
          latitude={selectedStop.stopLoc.coordinates[1]}
          longitude={selectedStop.stopLoc.coordinates[0]}
        >
          <StopPin
            highlighted={true}
            onClick={() => setSelectedStop(selectedStop)}
            stopName={selectedStop.stopName ?? ""}
          />
        </Marker>
      )}

      {/* Hovered stop (from list UI): highlighted HTML Marker when not selected */}
      {hoveringStop &&
        hoveringStop.stopId !== selectedStop?.stopId &&
        hoveringStop.stopLoc?.coordinates && (
          <Marker
            latitude={hoveringStop.stopLoc.coordinates[1]}
            longitude={hoveringStop.stopLoc.coordinates[0]}
          >
            <StopPin
              highlighted={true}
              stopName={hoveringStop.stopName ?? ""}
            />
          </Marker>
        )}
    </>
  );
};
