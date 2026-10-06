import { LatLon } from "features/nearby/utils/geo";
import { useCallback, useEffect, useState } from "react";

export type GeolocationStatus =
  | "locating"
  | "granted"
  | "denied"
  | "unavailable";

export interface GeolocationState {
  position?: LatLon;
  /** Accuracy radius in meters */
  accuracy?: number;
  status: GeolocationStatus;
  /** Ask again (e.g. after the rider taps "Use my location") */
  retry: () => void;
}

/**
 * Watches the rider's location. Never re-prompts on its own after a denial;
 * `retry` starts a new watch, which shows the browser prompt if allowed.
 */
export const useGeolocation = (enabled = true): GeolocationState => {
  const supported = typeof navigator !== "undefined" && !!navigator.geolocation;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<GeolocationState, "retry">>({
    status: supported ? "locating" : "unavailable",
  });

  useEffect(() => {
    if (!enabled || !supported) return;
    setState((previous) =>
      previous.position ? previous : { status: "locating" }
    );
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) =>
        setState({
          position: { latitude: coords.latitude, longitude: coords.longitude },
          accuracy: coords.accuracy,
          status: "granted",
        }),
      (error) =>
        setState((previous) =>
          // A transient timeout keeps the last known position
          previous.position && error.code !== error.PERMISSION_DENIED
            ? previous
            : {
                status:
                  error.code === error.PERMISSION_DENIED
                    ? "denied"
                    : "unavailable",
              }
        ),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, supported, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, retry };
};
