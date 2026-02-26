import { useAtom } from "jotai";
import * as React from "react";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, MapRef, Popup, Source, useMap } from "react-map-gl/mapbox";
import { useNavigate } from "react-router-dom";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { hoveringVehiclePositionAtom } from "shared/state/atoms";
import { VehiclePosition } from "shared/types/interface.d";

import { VehiclePopupContainer } from "./VehiclePopupContainer";

export const VEHICLE_CIRCLES_LAYER_ID = "vehicle-circles";
const VEHICLE_ARROWS_LAYER_ID = "vehicle-arrows";
const VEHICLE_LABELS_LAYER_ID = "vehicle-labels";
const VEHICLE_ARROW_IMAGE_ID = "vehicle-arrow";

// mapboxgl.MapLayerMouseEvent is deprecated in mapbox-gl v3; use this alias
type LayerMouseEvent = mapboxgl.MapMouseEvent & {
  features?: mapboxgl.GeoJSONFeature[];
};

function addVehicleArrowImage(map: MapRef) {
  if (map.hasImage(VEHICLE_ARROW_IMAGE_ID)) return;
  const size = 40;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const cx = size / 2;
  // Bus-from-above shape: rounded rectangular body with a pointed front (top = north).
  // When rotated by bearing, the pointed end shows the direction of travel.
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.beginPath();
  // Arrow tip (front of bus)
  ctx.moveTo(cx, 2);
  // Front-right shoulder
  ctx.lineTo(cx + 9, 13);
  // Right side down to rear
  ctx.lineTo(cx + 9, size - 8);
  // Rear-right rounded corner
  ctx.quadraticCurveTo(cx + 9, size - 2, cx + 4, size - 2);
  // Rear edge
  ctx.lineTo(cx - 4, size - 2);
  // Rear-left rounded corner
  ctx.quadraticCurveTo(cx - 9, size - 2, cx - 9, size - 8);
  // Left side up to front
  ctx.lineTo(cx - 9, 13);
  ctx.closePath();
  ctx.fill();

  // Windows: two small rounded rects on each side to read as a bus
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  // Left window
  ctx.beginPath();
  ctx.roundRect(cx - 8, 16, 5, 7, 1);
  ctx.fill();
  // Right window
  ctx.beginPath();
  ctx.roundRect(cx + 3, 16, 5, 7, 1);
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
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();
  const [hoveringVehicle, setHoveringVehicle] = useAtom(
    hoveringVehiclePositionAtom
  );
  // Separate "pinned" state — set on click, cleared by clicking the map background
  const [pinnedVehicle, setPinnedVehicle] = useState<
    VehiclePosition | undefined
  >(undefined);
  // Ref flag so the map-level click handler can tell if a vehicle circle was just clicked
  const vehicleJustClickedRef = useRef(false);

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
            currentStatus: vp.currentStatus ?? "",
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
    const vehicleId =
      hoveringVehicle?.vehicle?.id ?? pinnedVehicle?.vehicle?.id;
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
  }, [map, hoveringVehicle, pinnedVehicle]);

  const handleVehicleMouseEnter = useCallback(
    (e: LayerMouseEvent) => {
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
    (e: LayerMouseEvent) => {
      const vehicleId = e.features?.[0]?.properties?.vehicleId as
        | string
        | undefined;
      if (!vehicleId || !vehiclesById.has(vehicleId)) return;
      const vp = vehiclesById.get(vehicleId)!;
      // Mark that this click was on a vehicle so the map background handler
      // does not immediately clear the pinned popup
      vehicleJustClickedRef.current = true;
      setPinnedVehicle(vp);
      const routeId = vp.trip?.routeId;
      if (routeId) {
        navigate(`/route/${routeId}/direction/0${viewStatePathname}`);
      }
    },
    [navigate, vehiclesById, viewStatePathname]
  );

  // Map background click: dismiss the pinned popup when clicking outside a vehicle
  const handleMapClick = useCallback(() => {
    if (!vehicleJustClickedRef.current) {
      setPinnedVehicle(undefined);
      setHoveringVehicle(undefined);
    }
    vehicleJustClickedRef.current = false;
  }, [setHoveringVehicle]);

  // Register layer event handlers
  useEffect(() => {
    if (!map) return;
    map.on("mouseenter", VEHICLE_CIRCLES_LAYER_ID, handleVehicleMouseEnter);
    map.on("mouseleave", VEHICLE_CIRCLES_LAYER_ID, handleVehicleMouseLeave);
    map.on("click", VEHICLE_CIRCLES_LAYER_ID, handleVehicleClick);
    map.on("click", handleMapClick);
    return () => {
      map.off("mouseenter", VEHICLE_CIRCLES_LAYER_ID, handleVehicleMouseEnter);
      map.off("mouseleave", VEHICLE_CIRCLES_LAYER_ID, handleVehicleMouseLeave);
      map.off("click", VEHICLE_CIRCLES_LAYER_ID, handleVehicleClick);
      map.off("click", handleMapClick);
    };
  }, [
    map,
    handleVehicleMouseEnter,
    handleVehicleMouseLeave,
    handleVehicleClick,
    handleMapClick,
  ]);

  const popupVehicle = pinnedVehicle ?? hoveringVehicle;
  const popupPosition = popupVehicle?.position;

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
            // Hovered: darken each state color
            [
              "match",
              ["get", "currentStatus"],
              "STOPPED_AT",
              "#B71C1C",
              "INCOMING_AT",
              "#E65100",
              /* IN_TRANSIT_TO + default */ "#1565C0",
            ],
            // Normal
            [
              "match",
              ["get", "currentStatus"],
              "STOPPED_AT",
              "#F44336",
              "INCOMING_AT",
              "#FF9800",
              /* IN_TRANSIT_TO + default */ "#1E88E5",
            ],
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
          "icon-size": 0.75,
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
          "text-offset": [0, -2.2],
          "text-size": 11,
        }}
        paint={{
          "text-color": "#ffffff",
          "text-halo-color": [
            "match",
            ["get", "currentStatus"],
            "STOPPED_AT",
            "#F44336",
            "INCOMING_AT",
            "#FF9800",
            "#1E88E5",
          ],
          "text-halo-width": 1.5,
        }}
        type={"symbol"}
      />

      {/* Popup: shown on hover OR pinned after click; click map background to dismiss */}
      {popupVehicle && popupPosition && (
        <Popup
          closeButton={false}
          closeOnClick={false}
          latitude={popupPosition.latitude}
          longitude={popupPosition.longitude}
          maxWidth={"none"}
          offset={20}
        >
          <VehiclePopupContainer vehiclePosition={popupVehicle} />
        </Popup>
      )}
    </Source>
  );
};
