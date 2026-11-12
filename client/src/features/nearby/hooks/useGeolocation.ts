import { LatLon } from "features/nearby/utils/geo";
import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { usesLocationAtom } from "shared/state/atoms";
import { track } from "shared/track";

export type GeolocationStatus =
  /** Not asked yet: waiting for the rider to tap "Use my location" */
  "idle" | "locating" | "granted" | "denied" | "unavailable";

export interface GeolocationState {
  position?: LatLon;
  /** Accuracy radius in meters */
  accuracy?: number;
  status: GeolocationStatus;
  /** Start (or restart) watching, e.g. when the rider taps "Use my location" */
  request: () => void;
  /** False when the browser has no geolocation at all (nothing to retry) */
  supported: boolean;
}

/**
 * Watches the rider's location, but only once they've asked for it.
 *
 * A first-time visitor (often arriving from a search result) never gets a
 * permission prompt on page load: an unexplained prompt is usually refused,
 * and phones then block the site for good. Watching starts on its own only
 * when the browser already allows location, or the rider used it before
 * (remembered per device).
 */
export const useGeolocation = (enabled = true): GeolocationState => {
  const supported = typeof navigator !== "undefined" && !!navigator.geolocation;
  const [optedIn, setOptedIn] = useAtom(usesLocationAtom);
  // Bumped by `request` so a new tap restarts the watch (and the prompt)
  const [attempt, setAttempt] = useState(0);
  const [tapped, setTapped] = useState(false);
  const [allowedByBrowser, setAllowedByBrowser] = useState(false);
  // Until the permission check answers, show "locating" rather than flash
  // the first-visit screen at a rider who already allowed location
  const [checking, setChecking] = useState(true);
  // Whether we may watch now. (The stored opt-in loads after first render.)
  const requested = tapped || optedIn || allowedByBrowser;
  const [state, setState] = useState<
    Omit<GeolocationState, "request" | "supported">
  >({
    status: supported ? "locating" : "unavailable",
  });

  // Follow the browser's permission: start when it's already allowed, and
  // recover on its own when the rider allows it in settings and comes back
  useEffect(() => {
    if (!enabled || !supported) return;
    let cancelled = false;
    let permission: PermissionStatus | undefined;
    const apply = (state: PermissionState) => {
      if (state === "granted") {
        setAllowedByBrowser(true);
        // Restart a watch that already failed while blocked
        setAttempt((n) => n + 1);
      } else {
        setAllowedByBrowser(false);
        if (state === "denied") setState({ status: "denied" });
      }
    };
    const onChange = () => permission && apply(permission.state);
    if (!navigator.permissions?.query) {
      setChecking(false);
      return;
    }
    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (cancelled) return;
        permission = status;
        // "prompt" needs nothing: wait for the rider (or their opt-in)
        if (status.state !== "prompt") apply(status.state);
        status.addEventListener?.("change", onChange);
      })
      // Some browsers reject unknown permission names; treat as "ask"
      .catch(() => undefined)
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
      permission?.removeEventListener?.("change", onChange);
    };
  }, [enabled, supported]);

  useEffect(() => {
    if (!enabled || !supported || !requested) return;
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
      (error) => {
        // A refusal also forgets the opt-in, so later visits don't prompt
        // on load again
        if (error.code === error.PERMISSION_DENIED) setOptedIn(false);
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
        );
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, supported, requested, attempt, setOptedIn]);

  // Remember the opt-in once (not on every GPS fix)
  const located = state.status === "granted";
  useEffect(() => {
    if (located && !optedIn) setOptedIn(true);
  }, [located, optedIn, setOptedIn]);

  // Record how a tap on "Use my location" turned out (once per tap)
  const awaitingTap = useRef(false);
  useEffect(() => {
    if (awaitingTap.current && state.status !== "locating") {
      awaitingTap.current = false;
      track("location", [state.status, "tap"]);
    }
    // Every update, not just status changes: a re-tap while blocked ends
    // "denied" → "locating" → "denied"
  }, [state]);

  const hasFix = useRef(false);
  hasFix.current = state.status === "granted";
  const request = useCallback(() => {
    if (hasFix.current) {
      // Already have a fix: the watch keeps it, so record the outcome now
      track("location", ["granted", "tap"]);
    } else {
      awaitingTap.current = true;
    }
    setTapped(true);
    setAttempt((n) => n + 1);
  }, []);

  const status: GeolocationStatus =
    !supported || requested || state.status === "denied"
      ? state.status
      : checking
        ? "locating"
        : "idle";

  return { ...state, status, request, supported };
};
