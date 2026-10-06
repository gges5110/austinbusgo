import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { Box, Link, Typography } from "@mui/material";
import { formatClockTime, minutesUntil } from "features/nearby/utils/countdown";
import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import { UpcomingArrival } from "shared/api/generated/model";

interface ArrivalTrackProps {
  arrival: UpcomingArrival;
  nowSeconds: number;
  stopId: string;
}

const relativeTime = (at: number, nowSeconds: number) => {
  const minutes = minutesUntil(at, nowSeconds);
  return minutes === 0 ? "now" : `${minutes} min`;
};

/** The stops between the bus and the rider, as a vertical line. */
export const ArrivalTrack: React.FC<ArrivalTrackProps> = ({
  arrival,
  nowSeconds,
  stopId,
}) => {
  const color = `#${arrival.routeColor || "1a73e8"}`;
  const track = arrival.track ?? [];

  return (
    <Box sx={{ pb: 1.5, pl: 4, pr: 2 }}>
      {track.map((stop, index) => {
        const isRiderStop = index === track.length - 1;
        const hiddenBefore = stop.stopsHiddenBefore ?? 0;
        return (
          <React.Fragment key={`${stop.stopSequence}`}>
            {hiddenBefore > 0 && (
              <TrackRow color={color} dashed={true}>
                <Typography color={"text.secondary"} variant={"caption"}>
                  {hiddenBefore} more {hiddenBefore === 1 ? "stop" : "stops"}
                </Typography>
              </TrackRow>
            )}
            <TrackRow
              color={color}
              marker={
                stop.isVehicleHere ? "bus" : isRiderStop ? "rider" : "stop"
              }
            >
              <Typography
                sx={{ flex: 1, fontWeight: isRiderStop ? 700 : 400 }}
                variant={"body2"}
              >
                {stop.stopName}
                {isRiderStop && " (your stop)"}
              </Typography>
              <Typography
                color={"text.secondary"}
                sx={{ whiteSpace: "nowrap" }}
                title={formatClockTime(stop.at)}
                variant={"body2"}
              >
                {relativeTime(stop.at, nowSeconds)}
              </Typography>
            </TrackRow>
          </React.Fragment>
        );
      })}
      <Link
        component={RouterLink}
        sx={{ display: "inline-block", mt: 1 }}
        to={`/stop/${stopId}/trip/${arrival.tripId}?routeId=${arrival.routeId}&directionId=${arrival.directionId ?? 0}`}
        variant={"body2"}
      >
        Full trip
      </Link>
    </Box>
  );
};

interface TrackRowProps {
  color: string;
  dashed?: boolean;
  marker?: "bus" | "stop" | "rider";
}

const TrackRow: React.FC<React.PropsWithChildren<TrackRowProps>> = ({
  children,
  color,
  dashed,
  marker,
}) => (
  <Box
    sx={{
      alignItems: "center",
      borderLeft: `3px ${dashed ? "dotted" : "solid"} ${color}`,
      display: "flex",
      gap: 1,
      minHeight: 32,
      pl: 2,
      position: "relative",
    }}
  >
    {marker === "bus" ? (
      <DirectionsBusIcon
        aria-label={"Bus is here"}
        sx={{
          backgroundColor: "background.paper",
          color,
          fontSize: 20,
          left: -12,
          position: "absolute",
        }}
      />
    ) : marker ? (
      <Box
        sx={{
          backgroundColor: marker === "rider" ? color : "background.paper",
          border: `3px solid ${color}`,
          borderRadius: "50%",
          height: 12,
          left: -8,
          position: "absolute",
          width: 12,
        }}
      />
    ) : null}
    {children}
  </Box>
);
