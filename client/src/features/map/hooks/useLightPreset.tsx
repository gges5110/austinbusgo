import { getLightPreset } from "features/map/utils/lightPreset";
import { useEffect } from "react";
import { useMap } from "react-map-gl/mapbox";

/**
 * Applies the Standard style's lighting preset (dawn/day/dusk/night) via
 * setConfigProperty — a config change, not a style reload, so toggling the
 * theme keeps all custom sources/layers intact.
 */
export const useLightPreset = (darkMode: boolean) => {
  const { mapId: map } = useMap();

  useEffect(() => {
    if (!map) return;
    const raw = map.getMap();

    const apply = () => {
      raw.setConfigProperty("basemap", "lightPreset", getLightPreset(darkMode));
    };

    // Style loads async; apply now if ready and re-apply on style loads
    if (raw.isStyleLoaded()) apply();
    raw.on("style.load", apply);
    return () => {
      raw.off("style.load", apply);
    };
  }, [map, darkMode]);
};
