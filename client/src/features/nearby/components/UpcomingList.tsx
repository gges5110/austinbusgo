import { Alert, Box, Skeleton, Typography } from "@mui/material";
import { UpcomingRow } from "features/nearby/components/UpcomingRow";
import {
  formatHeadsign,
  formatNextBusTime,
} from "features/nearby/utils/countdown";
import { groupArrivals } from "features/nearby/utils/groupArrivals";
import * as React from "react";
import { useEffect } from "react";
import { StopUpcoming, UpcomingArrival } from "shared/api/generated/model";
import { sinceLanding, track } from "shared/track";

interface UpcomingListProps {
  data?: StopUpcoming;
  expandedTripId?: string;
  nowSeconds: number;
  onToggle: (tripId: string) => void;
  /** Only show these routes; all when undefined */
  routeIds?: string[];
  /** Only show this direction of those routes */
  directionId?: number;
  /** Show at most this many routes */
  limit?: number;
  /** Shown when no bus matches, instead of the generic message */
  emptyTitle?: string;
}

/**
 * The next hour of buses at a stop, shared by Nearby and the Explore stop
 * page: loading skeleton, live-tracking outage banner, one row per route
 * and destination (its next bus, then the ones after), and the "no buses
 * in the next hour" message.
 */
export const UpcomingList: React.FC<UpcomingListProps> = ({
  data,
  expandedTripId,
  nowSeconds,
  onToggle,
  routeIds,
  directionId,
  limit,
  emptyTitle,
}) => {
  const matches = (arrival: UpcomingArrival) =>
    (!routeIds || routeIds.includes(arrival.routeId)) &&
    (directionId === undefined || arrival.directionId === directionId);
  const arrivals = (data?.arrivals ?? []).filter(matches);
  const groups = groupArrivals(arrivals).slice(0, limit);
  useTrackArrivalsShown(data, arrivals, routeIds, directionId);

  if (!data) {
    return (
      <Box sx={{ px: 2 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton height={56} key={i} />
        ))}
      </Box>
    );
  }

  const hiddenByFilter = arrivals.length === 0 && data.arrivals.length > 0;
  // The server looks ahead only when nothing at all comes in the next hour
  const next =
    data.nextScheduled && matches(data.nextScheduled)
      ? data.nextScheduled
      : undefined;

  return (
    <>
      {!data.realtimeAvailable && (
        <Alert severity={"info"} sx={{ borderRadius: 0 }}>
          Live tracking is unavailable right now. Showing scheduled times.
        </Alert>
      )}
      {arrivals.length === 0 ? (
        <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
          {next && !emptyTitle && !hiddenByFilter ? (
            // Lead with when the next bus comes: a page whose main line is
            // "No buses" reads to search engines as an empty (soft 404) page
            <>
              <Typography variant={"subtitle1"}>
                {`Next bus: Route ${next.routeId} ${formatHeadsign(
                  next.headsign,
                  next.routeId
                )}, ${formatNextBusTime(next.scheduledAt, nowSeconds)}`}
              </Typography>
              <Typography color={"text.secondary"} variant={"body2"}>
                None in the next hour
              </Typography>
            </>
          ) : (
            <>
              <Typography variant={"subtitle1"}>
                {emptyTitle ??
                  (hiddenByFilter
                    ? "No buses on the selected routes in the next hour"
                    : "No buses in the next hour")}
              </Typography>
              {next && (
                <Typography color={"text.secondary"} variant={"body2"}>
                  {`Next bus: Route ${next.routeId} ${formatHeadsign(
                    next.headsign,
                    next.routeId
                  )}, ${formatNextBusTime(next.scheduledAt, nowSeconds)}`}
                </Typography>
              )}
            </>
          )}
        </Box>
      ) : (
        <Box aria-live={"polite"} component={"ul"} sx={{ m: 0, p: 0 }}>
          {groups.map(({ next: arrival, later }) => (
            <UpcomingRow
              arrival={arrival}
              expanded={arrival.tripId === expandedTripId}
              key={`${arrival.routeId}-${arrival.headsign}`}
              later={later}
              nowSeconds={nowSeconds}
              onToggle={() => {
                if (arrival.tripId !== expandedTripId) {
                  track("bus_tap", [
                    arrival.status,
                    data.stop.stopId,
                    arrival.routeId,
                  ]);
                }
                onToggle(arrival.tripId);
              }}
              stopId={data.stop.stopId}
            />
          ))}
        </Box>
      )}
    </>
  );
};

/**
 * Records once per stop (and route filter) whether the rider got an answer:
 * any buses, any live, and how long after landing.
 */
const useTrackArrivalsShown = (
  data: StopUpcoming | undefined,
  arrivals: StopUpcoming["arrivals"],
  routeIds: string[] | undefined,
  directionId: number | undefined
) => {
  const stopId = data?.stop.stopId;
  const routes = routeIds?.join(",") ?? "";
  const loaded = data !== undefined;
  useEffect(() => {
    if (!loaded || !stopId) return;
    track(
      "arrivals",
      [
        arrivals.length > 0,
        arrivals.some((arrival) => arrival.status !== "scheduled"),
        stopId,
        routes,
      ],
      sinceLanding()
    );
    // Once per stop and filter, not on every 15s refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, stopId, routes, directionId]);
};
