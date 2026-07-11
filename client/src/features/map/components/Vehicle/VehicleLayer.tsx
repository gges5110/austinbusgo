import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MapHoverPopup } from "features/map/components/MapHoverPopup";
import { useFeatureHoverState } from "features/map/hooks/useFeatureHoverState";
import { useHoverClose } from "features/map/hooks/useHoverClose";
import {
  LayerMouseEvent,
  useLayerEvents,
  useMapClick,
} from "features/map/hooks/useLayerEvents";
import { GeneratedImage, useMapImage } from "features/map/hooks/useMapImage";
import { toPointFeatureCollection } from "features/map/utils/geojson";
import { useAtom, useSetAtom } from "jotai";
import * as React from "react";
import { FC, useCallback, useMemo, useRef } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { useNavigate } from "react-router-dom";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import {
  hoveringStopAtom,
  hoveringVehiclePositionAtom,
  pinnedVehiclePositionAtom,
} from "shared/state/atoms";
import { VehiclePosition } from "shared/types/interface.d";

import { VehiclePeekSheet } from "./VehiclePeekSheet";
import { VehiclePopupContainer } from "./VehiclePopupContainer";

export const VEHICLE_CIRCLES_LAYER_ID = "vehicle-circles";
const VEHICLE_ARROWS_LAYER_ID = "vehicle-arrows";
const VEHICLE_LABELS_LAYER_ID = "vehicle-labels";
const VEHICLE_ARROW_IMAGE_ID = "vehicle-arrow";
const VEHICLE_LAYER_IDS = [VEHICLE_CIRCLES_LAYER_ID];
const VEHICLES_SOURCE_ID = "vehicles-source";

function createVehicleArrowImage(): GeneratedImage | null {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const cx = size / 2;
  // Navigation chevron: the same pattern used by Google Maps / Apple Maps / Waze
  // for live vehicle direction — a solid arrowhead with a notched tail so it
  // reads as motion rather than a static triangle.
  //
  //       ^   ← tip (north / direction of travel)
  //      / \
  //     /   \
  //    / · · \
  //   /___^___\  ← notched rear
  //
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.beginPath();
  ctx.moveTo(cx, 2); // tip
  ctx.lineTo(cx + 11, size - 4); // bottom-right
  ctx.lineTo(cx, size - 10); // rear notch (inner)
  ctx.lineTo(cx - 11, size - 4); // bottom-left
  ctx.closePath();
  ctx.fill();

  // Thin dark stroke so the white arrow is visible on light-coloured circles
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 0.75;
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, size, size);
  return { width: size, height: size, data: imageData.data };
}

interface VehicleLayerProps {
  readonly vehiclePositions: VehiclePosition[];
}

export const VehicleLayer: FC<VehicleLayerProps> = ({ vehiclePositions }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();
  const [hoveringVehicle, setHoveringVehicle] = useAtom(
    hoveringVehiclePositionAtom
  );
  // Separate "pinned" state — set on click, cleared by clicking the map background
  const [pinnedVehicle, setPinnedVehicle] = useAtom(pinnedVehiclePositionAtom);
  const setHoveringStop = useSetAtom(hoveringStopAtom);
  // Ref flag so the map-level click handler can tell if a vehicle circle was just clicked
  const vehicleJustClickedRef = useRef(false);

  const closeHoverPopup = useCallback(
    () => setHoveringVehicle(undefined),
    [setHoveringVehicle]
  );
  const { scheduleClose, cancelClose } = useHoverClose(closeHoverPopup);

  useMapImage(VEHICLE_ARROW_IMAGE_ID, createVehicleArrowImage);

  // Lookup map for click/hover resolution
  const vehiclesById = useMemo(() => {
    const m = new Map<string, VehiclePosition>();
    for (const vp of vehiclePositions) {
      if (vp.vehicle?.id) m.set(vp.vehicle.id, vp);
    }
    return m;
  }, [vehiclePositions]);

  const vehiclesGeoJSON = useMemo(
    () =>
      toPointFeatureCollection(
        vehiclePositions,
        (vp) =>
          vp.position
            ? [vp.position.longitude, vp.position.latitude]
            : undefined,
        (vp) => ({
          bearing: vp.position?.bearing ?? 0,
          currentStatus: vp.currentStatus ?? "",
          routeId: vp.trip?.routeId ?? "",
          vehicleId: vp.vehicle?.id ?? "",
        })
      ),
    [vehiclePositions]
  );

  // Sync hoveringVehicle atom → Mapbox feature state for circle highlight
  useFeatureHoverState(
    VEHICLES_SOURCE_ID,
    hoveringVehicle?.vehicle?.id ?? pinnedVehicle?.vehicle?.id
  );

  const handleMouseEnter = useCallback(
    (e: LayerMouseEvent) => {
      cancelClose();
      setHoveringStop(undefined);
      const vehicleId = e.features?.[0]?.properties?.vehicleId as
        | string
        | undefined;
      if (vehicleId && vehiclesById.has(vehicleId)) {
        setHoveringVehicle(vehiclesById.get(vehicleId));
      }
    },
    [cancelClose, setHoveringStop, vehiclesById, setHoveringVehicle]
  );

  const handleClick = useCallback(
    (e: LayerMouseEvent) => {
      const vehicleId = e.features?.[0]?.properties?.vehicleId as
        | string
        | undefined;
      const vp = vehicleId ? vehiclesById.get(vehicleId) : undefined;
      if (!vp) return;
      // Mark that this click was on a vehicle so the map background handler
      // does not immediately clear the pinned popup
      vehicleJustClickedRef.current = true;
      setHoveringStop(undefined);
      setPinnedVehicle(vp);
      if (!isMobile) {
        const routeId = vp.trip?.routeId;
        if (routeId) {
          navigate(`/route/${routeId}/direction/0${viewStatePathname}`);
        }
      }
    },
    [
      isMobile,
      navigate,
      setHoveringStop,
      setPinnedVehicle,
      vehiclesById,
      viewStatePathname,
    ]
  );

  // Map background click: dismiss the pinned popup when clicking outside a vehicle
  const handleMapClick = useCallback(() => {
    if (!vehicleJustClickedRef.current) {
      setPinnedVehicle(undefined);
      setHoveringVehicle(undefined);
    }
    vehicleJustClickedRef.current = false;
  }, [setPinnedVehicle, setHoveringVehicle]);

  useLayerEvents(VEHICLE_LAYER_IDS, {
    onClick: handleClick,
    onMouseEnter: isMobile ? undefined : handleMouseEnter,
    onMouseLeave: isMobile ? undefined : scheduleClose,
  });
  useMapClick(handleMapClick);

  const popupVehicle = pinnedVehicle ?? hoveringVehicle;
  const popupPosition = popupVehicle?.position;

  const closePopup = useCallback(() => {
    setPinnedVehicle(undefined);
    setHoveringVehicle(undefined);
  }, [setPinnedVehicle, setHoveringVehicle]);

  return (
    <Source
      data={vehiclesGeoJSON}
      id={VEHICLES_SOURCE_ID}
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
          "icon-size": 0.85,
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

      {/* Mobile: peek sheet on tap */}
      {isMobile && popupVehicle && (
        <VehiclePeekSheet
          onClose={closePopup}
          open={true}
          vehiclePosition={popupVehicle}
        />
      )}
      {/* Desktop: hover/pinned popup anchored to the map */}
      {!isMobile && popupVehicle && popupPosition && (
        <MapHoverPopup
          latitude={popupPosition.latitude}
          longitude={popupPosition.longitude}
          offset={20}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <VehiclePopupContainer vehiclePosition={popupVehicle} />
        </MapHoverPopup>
      )}
    </Source>
  );
};
