import { useEffect } from "react";
import { useMap } from "react-map-gl/mapbox";

/**
 * Mirrors an app-level hover selection onto Mapbox feature state so style
 * expressions like ["feature-state", "hovered"] can highlight the feature
 * (e.g. when hovering the corresponding item in a sidebar).
 */
export const useFeatureHoverState = (
  sourceId: string,
  featureId: string | null | undefined
) => {
  const { mapId: map } = useMap();

  useEffect(() => {
    if (!map || !featureId) return;
    if (!map.getSource(sourceId)) return;

    map.setFeatureState({ id: featureId, source: sourceId }, { hovered: true });

    return () => {
      if (map.getSource(sourceId)) {
        map.setFeatureState(
          { id: featureId, source: sourceId },
          { hovered: false }
        );
      }
    };
  }, [map, sourceId, featureId]);
};
