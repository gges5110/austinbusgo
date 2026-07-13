import { useEffect } from "react";
import { useMap } from "react-map-gl/mapbox";

// Shape consumed by handlers: the hovered/clicked feature(s) plus the
// standard mouse event fields (point, lngLat, ...)
export type LayerMouseEvent = mapboxgl.MapMouseEvent & {
  features?: mapboxgl.GeoJSONFeature[];
};

interface LayerEventHandlers {
  onClick?: (e: LayerMouseEvent) => void;
  onMouseEnter?: (e: LayerMouseEvent) => void;
  onMouseLeave?: (e: LayerMouseEvent) => void;
}

const toLayerMouseEvent = (event: {
  feature?: unknown;
  point: unknown;
  lngLat: unknown;
  originalEvent: unknown;
}): LayerMouseEvent =>
  ({
    features: event.feature ? [event.feature] : [],
    point: event.point,
    lngLat: event.lngLat,
    originalEvent: event.originalEvent,
  }) as unknown as LayerMouseEvent;

/**
 * Registers mouse handlers on a set of Mapbox layers via the native
 * Interactions API (map.addInteraction). Compared with the old
 * map.on(event, layerId, ...) wiring, interactions understand stacking:
 * a click handled here consumes the event, so a targetless interaction
 * (useMapClick) only fires for true background clicks — no ref flags
 * needed to tell the two apart.
 *
 * `layerIds` and the handlers must be referentially stable (module constant /
 * useCallback) to avoid re-registering on every render.
 */
export const useLayerEvents = (
  layerIds: readonly string[],
  { onClick, onMouseEnter, onMouseLeave }: LayerEventHandlers
) => {
  const { mapId: map } = useMap();

  useEffect(() => {
    if (!map) return;
    const raw = map.getMap();

    const ids: string[] = [];
    const add = (
      layerId: string,
      type: "click" | "mouseenter" | "mouseleave",
      handler: (e: LayerMouseEvent) => void
    ) => {
      const id = `${layerId}-${type}`;
      raw.addInteraction(id, {
        type,
        target: { layerId },
        handler: (event) => {
          handler(toLayerMouseEvent(event));
          // Consume so stacked/background interactions don't also fire
          return true;
        },
      });
      ids.push(id);
    };

    for (const layerId of layerIds) {
      if (onClick) add(layerId, "click", onClick);
      if (onMouseEnter) add(layerId, "mouseenter", onMouseEnter);
      if (onMouseLeave) add(layerId, "mouseleave", onMouseLeave);
    }
    return () => {
      for (const id of ids) {
        raw.removeInteraction(id);
      }
    };
  }, [map, layerIds, onClick, onMouseEnter, onMouseLeave]);
};

/**
 * Registers a handler for clicks on the map background — clicks on layers
 * with their own interactions are consumed before reaching this one (unlike
 * the old map.on("click") which fired for every click anywhere).
 */
export const useMapClick = (onClick: (e: mapboxgl.MapMouseEvent) => void) => {
  const { mapId: map } = useMap();

  useEffect(() => {
    if (!map) return;
    const raw = map.getMap();
    const id = "map-background-click";
    raw.addInteraction(id, {
      type: "click",
      handler: (event) => {
        onClick(event as unknown as mapboxgl.MapMouseEvent);
        return true;
      },
    });
    return () => {
      raw.removeInteraction(id);
    };
  }, [map, onClick]);
};
