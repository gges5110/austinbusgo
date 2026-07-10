import { useEffect } from "react";
import { useMap } from "react-map-gl/mapbox";

// mapboxgl.MapLayerMouseEvent is deprecated in mapbox-gl v3; use this alias
export type LayerMouseEvent = mapboxgl.MapMouseEvent & {
  features?: mapboxgl.GeoJSONFeature[];
};

interface LayerEventHandlers {
  onClick?: (e: LayerMouseEvent) => void;
  onMouseEnter?: (e: LayerMouseEvent) => void;
  onMouseLeave?: (e: LayerMouseEvent) => void;
}

/**
 * Registers mouse handlers on a set of Mapbox layers with automatic cleanup.
 * react-map-gl's <Layer> has no event props, so layer-scoped events must go
 * through map.on(event, layerId, handler); this hook centralizes that wiring.
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
    for (const layerId of layerIds) {
      if (onClick) map.on("click", layerId, onClick);
      if (onMouseEnter) map.on("mouseenter", layerId, onMouseEnter);
      if (onMouseLeave) map.on("mouseleave", layerId, onMouseLeave);
    }
    return () => {
      for (const layerId of layerIds) {
        if (onClick) map.off("click", layerId, onClick);
        if (onMouseEnter) map.off("mouseenter", layerId, onMouseEnter);
        if (onMouseLeave) map.off("mouseleave", layerId, onMouseLeave);
      }
    };
  }, [map, layerIds, onClick, onMouseEnter, onMouseLeave]);
};

/**
 * Registers a click handler on the map itself (any click, not layer-scoped),
 * e.g. to dismiss a pinned popup when clicking the map background.
 */
export const useMapClick = (onClick: (e: mapboxgl.MapMouseEvent) => void) => {
  const { mapId: map } = useMap();

  useEffect(() => {
    if (!map) return;
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [map, onClick]);
};
