import { Box } from "@mui/material";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { Suspense, useEffect, useState } from "react";

const MapWithProvider = React.lazy(
  () => import("features/map/components/MapWithProvider")
);

// Upper bound on how long the map waits for the page's data
const MAX_DEFER_MS = 5000;

/**
 * Starts loading the map once the page's own data has arrived and the
 * browser is idle (or after `maxDelayMs` at the latest).
 *
 * Mapbox GL is most of the app's JavaScript and takes seconds of main-thread
 * time on a mid-range phone. If it starts while a page is still waiting for
 * its data (e.g. a stop's arrivals), it delays rendering that data when it
 * arrives. Waiting until no queries are in flight lets riders see their
 * stop and arrival times first; the map follows a moment later.
 */
export const useDeferredStart = (maxDelayMs = MAX_DEFER_MS) => {
  const queryClient = useQueryClient();
  const fetching = useIsFetching();
  const [started, setStarted] = useState(false);

  // Hard cap, so a slow or failing request never keeps the map away
  useEffect(() => {
    const id = window.setTimeout(() => setStarted(true), maxDelayMs);
    return () => window.clearTimeout(id);
  }, [maxDelayMs]);

  useEffect(() => {
    if (started || fetching > 0) return;
    // Re-checked when the callback fires: a page's queries can start in the
    // same commit, after this effect ran. If one did, `fetching` changes and
    // this effect runs again once it settles.
    const start = () => {
      if (queryClient.isFetching() === 0) setStarted(true);
    };
    // Safari only recently gained requestIdleCallback
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 1000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 50);
    return () => window.clearTimeout(id);
  }, [fetching, queryClient, started]);

  return started;
};

/** Fills the map's space until it loads, so nothing shifts when it does. */
const MapPlaceholder: React.FC = () => (
  <Box
    aria-hidden={true}
    sx={{ backgroundColor: "action.hover", height: "100%", width: "100%" }}
  />
);

export const LazyMap: React.FC = () => {
  const started = useDeferredStart();
  if (!started) return <MapPlaceholder />;
  return (
    <Suspense fallback={<MapPlaceholder />}>
      <MapWithProvider />
    </Suspense>
  );
};
