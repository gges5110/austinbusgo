import { useAtom } from "jotai";
import * as React from "react";
import { FC, useCallback, useEffect, useMemo } from "react";
import { Layer, Popup, Source, useMap } from "react-map-gl/mapbox";
import { hoveringVehiclePositionAtom } from "shared/state/atoms";
import { VehiclePosition } from "shared/types/interface.d";

import { VehiclePopupContainer } from "./VehiclePopupContainer";

export const VEHICLE_CIRCLES_LAYER_ID = "vehicle-circles";
const VEHICLE_ARROWS_LAYER_ID = "vehicle-arrows";
const VEHICLE_LABELS_LAYER_ID = "vehicle-labels";
const VEHICLE_ARROW_IMAGE_ID = "vehicle-arrow";

function addVehicleArrowImage(map: mapboxgl.Map) {
  if (map.hasImage(VEHICLE_ARROW_IMAGE_ID)) return;
  const size = 28;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  // Upward-pointing chevron arrow, white with slight transparency
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.beginPath();
  ctx.moveTo(size / 2, 2);
  ctx.lineTo(size - 3, size - 3);
  ctx.lineTo(size / 2, size - 9);
  ctx.lineTo(3, size - 3);
  ctx.closePath();
  ctx.fill();
  const imageData = ctx.getImageData(0, 0, size, size);
  map.addImage(VEHICLE_ARROW_IMAGE_ID, {
    width: size,
    height: size,
    data: imageData.data as unknown as Uint8Array,
  });
}

interface VehicleLayerProps {
  readonly vehiclePositions: VehiclePosition[];
}

export const VehicleLayer: FC<VehicleLayerProps> = ({ vehiclePositions }) => {
  const { mapId: map } = useMap();
  const [hoveringVehicle, setHoveringVehicle] = useAtom(
    hoveringVehiclePositionAtom
  );

  // Add custom arrow image to map on load
  useEffect(() => {
    if (!map) return;
    if (map.isStyleLoaded()) {
      addVehicleArrowImage(map);
    } else {
      map.once("load", () => addVehicleArrowImage(map));
    }
  }, [map]);

  // Lookup map for click/hover resolution
  const vehiclesById = useMemo(() => {
    const m = new Map<string, VehiclePosition>();
    for (const vp of vehiclePositions) {
      if (vp.vehicle?.id) m.set(vp.vehicle.id, vp);
    }
    return m;
  }, [vehiclePositions]);

  // Build GeoJSON source
  const vehiclesGeoJSON = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: vehiclePositions
        .filter((vp) => vp.position != null)
        .map((vp) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [vp.position!.longitude, vp.position!.latitude],
          },
          properties: {
            bearing: vp.position?.bearing ?? 0,
            routeId: vp.trip?.routeId ?? "",
            vehicleId: vp.vehicle?.id ?? "",
          },
        })),
    }),
    [vehiclePositions]
  );

  // Sync hoveringVehicle atom → Mapbox feature state for circle highlight
  useEffect(() => {
    if (!map) return;
    const vehicleId = hoveringVehicle?.vehicle?.id;
    if (!vehicleId) return;
    if (!map.getSource("vehicles-source")) return;
    map.setFeatureState(
      { id: vehicleId, source: "vehicles-source" },
      { hovered: true }
    );
    return () => {
      if (map.getSource("vehicles-source")) {
        map.setFeatureState(
          { id: vehicleId, source: "vehicles-source" },
          { hovered: false }
        );
      }
    };
  }, [map, hoveringVehicle]);

  const handleVehicleMouseEnter = useCallback(
    (e: mapboxgl.MapLayerMouseEvent) => {
      const vehicleId = e.features?.[0]?.properties?.vehicleId as
        | string
        | undefined;
      if (vehicleId && vehiclesById.has(vehicleId)) {
        setHoveringVehicle(vehiclesById.get(vehicleId));
      }
    },
    [vehiclesById, setHoveringVehicle]
  );

  const handleVehicleMouseLeave = useCallback(() => {
    setHoveringVehicle(undefined);
  }, [setHoveringVehicle]);

  const handleVehicleClick = useCallback(
    (e: mapboxgl.MapLayerMouseEvent) => {
      if (!map) return;
      const vehicleId = e.features?.[0]?.properties?.vehicleId as
        | string
        | undefined;
      if (!vehicleId || !vehiclesById.has(vehicleId)) return;
      const vp = vehiclesById.get(vehicleId)!;
      setHoveringVehicle(vp);
      if (vp.position) {
        map.flyTo({
          center: [vp.position.longitude, vp.position.latitude],
          zoom: 16,
        });
      }
      // Prevent stop layer click from firing on the same event
      e.originalEvent.stopPropagation();
    },
    [map, vehiclesById, setHoveringVehicle]
  );

  // Register layer event handlers
  useEffect(() => {
    if (!map) return;
    map.on("mouseenter", VEHICLE_CIRCLES_LAYER_ID, handleVehicleMouseEnter);
    map.on("mouseleave", VEHICLE_CIRCLES_LAYER_ID, handleVehicleMouseLeave);
    map.on("click", VEHICLE_CIRCLES_LAYER_ID, handleVehicleClick);
    return () => {
      map.off("mouseenter", VEHICLE_CIRCLES_LAYER_ID, handleVehicleMouseEnter);
      map.off("mouseleave", VEHICLE_CIRCLES_LAYER_ID, handleVehicleMouseLeave);
      map.off("click", VEHICLE_CIRCLES_LAYER_ID, handleVehicleClick);
    };
  }, [
    map,
    handleVehicleMouseEnter,
    handleVehicleMouseLeave,
    handleVehicleClick,
  ]);

  const popupPosition = hoveringVehicle?.position;

  return (
    <Source
      data={vehiclesGeoJSON}
      id={"vehicles-source"}
      promoteId={"vehicleId"}
      type={"geojson"}
    >
      {/* Circle layer: orange dot at each vehicle position */}
      <Layer
        id={VEHICLE_CIRCLES_LAYER_ID}
        paint={{
          "circle-color": [
            "case",
            ["boolean", ["feature-state", "hovered"], false],
            "#E65100",
            "#FF9800",
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            6,
            14,
            9,
            18,
            13,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        }}
        type={"circle"}
      />

      {/* Arrow layer: directional indicator rotated by bearing */}
      <Layer
        id={VEHICLE_ARROWS_LAYER_ID}
        layout={{
          "icon-allow-overlap": true,
          "icon-image": VEHICLE_ARROW_IMAGE_ID,
          "icon-rotate": ["get", "bearing"],
          "icon-rotation-alignment": "map",
          "icon-size": 0.7,
        }}
        paint={{
          "icon-opacity": [
            "case",
            ["boolean", ["feature-state", "hovered"], false],
            1,
            0.8,
          ],
        }}
        type={"symbol"}
      />

      {/* Label layer: route ID above the circle */}
      <Layer
        id={VEHICLE_LABELS_LAYER_ID}
        layout={{
          "text-allow-overlap": false,
          "text-field": ["get", "routeId"],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-offset": [0, -1.8],
          "text-size": 11,
        }}
        paint={{
          "text-color": "#ffffff",
          "text-halo-color": "#E65100",
          "text-halo-width": 1.5,
        }}
        type={"symbol"}
      />

      {/* Popup shown on hover/highlight */}
      {hoveringVehicle && popupPosition && (
        <Popup
          closeButton={false}
          closeOnClick={false}
          latitude={popupPosition.latitude}
          longitude={popupPosition.longitude}
          maxWidth={"none"}
          offset={20}
        >
          <VehiclePopupContainer vehiclePosition={hoveringVehicle} />
        </Popup>
      )}
    </Source>
  );
};
