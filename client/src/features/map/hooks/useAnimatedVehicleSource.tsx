import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/mapbox";

/** Matches the GTFS-RT poll cadence closely enough to stay in motion. */
const ANIMATION_MS = 2500;

type PointFeature = GeoJSON.Feature<GeoJSON.Point>;
type PointCollection = GeoJSON.FeatureCollection<GeoJSON.Point>;

interface VehicleFrame {
  lon: number;
  lat: number;
  bearing: number;
}

/** Signed shortest rotation from one bearing to another, in degrees. */
const shortestRotation = (from: number, to: number) => {
  let delta = (to - from) % 360;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
};

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Glides vehicles between GTFS-RT polls instead of teleporting them.
 *
 * The Mapbox source is driven imperatively (setData per animation frame) so
 * React doesn't re-render 60x/second; the <Source> element must be mounted
 * with a stable empty FeatureCollection so react-map-gl never overwrites the
 * animated data. Positions and bearings ease from the previously rendered
 * frame to each vehicle's newest reported location; new vehicles appear in
 * place and vanished ones drop out immediately.
 */
export const useAnimatedVehicleSource = (
  sourceId: string,
  target: PointCollection
) => {
  const { mapId: map } = useMap();
  // Last rendered frame per vehicle id — the animation start point
  const currentRef = useRef(new globalThis.Map<string, VehicleFrame>());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map) return;
    const raw = map.getMap();

    const write = (data: PointCollection) => {
      const source = raw.getSource(sourceId) as mapboxgl.GeoJSONSource | null;
      if (source && typeof source.setData === "function") {
        source.setData(data);
      }
    };

    const to = new globalThis.Map<string, PointFeature>();
    for (const feature of target.features) {
      const id = feature.properties?.vehicleId as string | undefined;
      if (id) to.set(id, feature);
    }
    const from = new globalThis.Map(currentRef.current);
    const skipAnimation = prefersReducedMotion();

    const start = performance.now();
    const frame = (now: number) => {
      const t = skipAnimation ? 1 : Math.min(1, (now - start) / ANIMATION_MS);
      const eased = t * (2 - t);
      const next = new globalThis.Map<string, VehicleFrame>();
      const features: PointFeature[] = [];
      for (const [id, feature] of to) {
        const [lon, lat] = feature.geometry.coordinates;
        const bearing = (feature.properties?.bearing as number) ?? 0;
        const prev = from.get(id);
        const current: VehicleFrame =
          !prev || t >= 1
            ? { lon, lat, bearing }
            : {
                lon: prev.lon + (lon - prev.lon) * eased,
                lat: prev.lat + (lat - prev.lat) * eased,
                bearing:
                  prev.bearing +
                  shortestRotation(prev.bearing, bearing) * eased,
              };
        next.set(id, current);
        features.push({
          ...feature,
          geometry: {
            type: "Point",
            coordinates: [current.lon, current.lat],
          },
          properties: { ...feature.properties, bearing: current.bearing },
        });
      }
      currentRef.current = next;
      write({ type: "FeatureCollection", features });
      rafRef.current = t < 1 ? requestAnimationFrame(frame) : null;
    };

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [map, sourceId, target]);
};
