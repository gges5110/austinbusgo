import { Alert, Box, Skeleton, Typography } from "@mui/material";
import { UpcomingRow } from "features/nearby/components/UpcomingRow";
import {
  formatClockTime,
  formatHeadsign,
} from "features/nearby/utils/countdown";
import * as React from "react";
import { StopUpcoming } from "shared/api/generated/model";

interface UpcomingListProps {
  data?: StopUpcoming;
  expandedTripId?: string;
  nowSeconds: number;
  onToggle: (tripId: string) => void;
  /** Only show these routes; all when undefined */
  routeIds?: string[];
}

/**
 * The next hour of buses at a stop, shared by Nearby and the Explore stop
 * page: loading skeleton, live-tracking outage banner, rows, and the
 * "no buses in the next hour" message.
 */
export const UpcomingList: React.FC<UpcomingListProps> = ({
  data,
  expandedTripId,
  nowSeconds,
  onToggle,
  routeIds,
}) => {
  if (!data) {
    return (
      <Box sx={{ px: 2 }}>
        {[0, 1, 2].map((i) => (
          <Skeleton height={56} key={i} />
        ))}
      </Box>
    );
  }

  const arrivals = routeIds
    ? data.arrivals.filter((arrival) => routeIds.includes(arrival.routeId))
    : data.arrivals;
  const next = data.nextScheduled;
  const hiddenByFilter = arrivals.length === 0 && data.arrivals.length > 0;

  return (
    <>
      {!data.realtimeAvailable && (
        <Alert severity={"info"} sx={{ borderRadius: 0 }}>
          Live tracking is unavailable right now. Showing scheduled times.
        </Alert>
      )}
      {arrivals.length === 0 ? (
        <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
          <Typography variant={"subtitle1"}>
            {hiddenByFilter
              ? "No buses on the selected routes in the next hour"
              : "No buses in the next hour"}
          </Typography>
          {next && !hiddenByFilter && (
            <Typography color={"text.secondary"} variant={"body2"}>
              {`Next: Route ${next.routeId} ${formatHeadsign(
                next.headsign,
                next.routeId
              )} at ${formatClockTime(next.scheduledAt)}`}
            </Typography>
          )}
        </Box>
      ) : (
        <Box aria-live={"polite"} component={"ul"} sx={{ m: 0, p: 0 }}>
          {arrivals.map((arrival) => (
            <UpcomingRow
              arrival={arrival}
              expanded={arrival.tripId === expandedTripId}
              key={`${arrival.tripId}-${arrival.scheduledAt}`}
              nowSeconds={nowSeconds}
              onToggle={() => onToggle(arrival.tripId)}
              stopId={data.stop.stopId}
            />
          ))}
        </Box>
      )}
    </>
  );
};
