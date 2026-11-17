import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SensorsRoundedIcon from "@mui/icons-material/SensorsRounded";
import { Box, Collapse, ListItemButton, Typography } from "@mui/material";
import { ArrivalTrack } from "features/nearby/components/ArrivalTrack";
import {
  countdownLabel,
  distanceLabel,
  effectiveAt,
  formatHeadsign,
  minutesUntil,
} from "features/nearby/utils/countdown";
import * as React from "react";
import { UpcomingArrival } from "shared/api/generated/model";
import { RouteIdDisplay } from "shared/components/RouteIdDisplay/RouteIdDisplay";

interface UpcomingRowProps {
  arrival: UpcomingArrival;
  expanded: boolean;
  /** The route's buses after this one, soonest first */
  later?: UpcomingArrival[];
  nowSeconds: number;
  onToggle: () => void;
  stopId: string;
}

export const LIVE_GREEN = "#0a8a3a";

const isLiveArrival = (arrival: UpcomingArrival) =>
  arrival.status !== "scheduled";

/** "then 18, 32 min" (screen readers: "then 18 min live, 32 min scheduled") */
const LaterTimes = ({
  later,
  nowSeconds,
}: {
  later: UpcomingArrival[];
  nowSeconds: number;
}) => (
  <Typography
    aria-label={`then ${later
      .map(
        (arrival) =>
          `${minutesUntil(effectiveAt(arrival), nowSeconds)} min ${
            isLiveArrival(arrival) ? "live" : "scheduled"
          }`
      )
      .join(", ")}`}
    color={"text.secondary"}
    sx={{ whiteSpace: "nowrap" }}
    variant={"caption"}
  >
    {"then "}
    {later.map((arrival, i) => (
      <React.Fragment key={arrival.tripId}>
        {i > 0 && ", "}
        <Box
          component={"span"}
          sx={
            isLiveArrival(arrival)
              ? { color: LIVE_GREEN, fontWeight: 700 }
              : undefined
          }
        >
          {minutesUntil(effectiveAt(arrival), nowSeconds)}
        </Box>
      </React.Fragment>
    ))}
    {" min"}
  </Typography>
);

export const UpcomingRow: React.FC<UpcomingRowProps> = ({
  arrival,
  expanded,
  later = [],
  nowSeconds,
  onToggle,
  stopId,
}) => {
  const isLive = isLiveArrival(arrival);
  const isArriving = arrival.status === "arriving";
  const canExpand = (arrival.track?.length ?? 0) > 0;
  const countdown = countdownLabel(arrival, nowSeconds);

  return (
    <Box
      component={"li"}
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        listStyle: "none",
      }}
    >
      <ListItemButton
        aria-expanded={canExpand ? expanded : undefined}
        disabled={!canExpand}
        onClick={onToggle}
        sx={{
          "&.Mui-disabled": { opacity: 1 },
          gap: 1.5,
          py: 1.25,
        }}
      >
        <RouteIdDisplay
          routeColor={arrival.routeColor}
          routeId={arrival.routeId}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap={true} variant={"body1"}>
            {formatHeadsign(arrival.headsign, arrival.routeId)}
          </Typography>
          <Typography color={"text.secondary"} variant={"body2"}>
            {distanceLabel(arrival)}
          </Typography>
        </Box>
        <Box
          sx={{
            alignItems: "flex-end",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          <Typography
            aria-label={
              isLive ? `${countdown}, live` : `${countdown}, scheduled`
            }
            sx={
              isArriving
                ? {
                    backgroundColor: "error.main",
                    borderRadius: 4,
                    color: "error.contrastText",
                    fontWeight: 700,
                    px: 1,
                    py: 0.25,
                  }
                : {
                    color: isLive ? LIVE_GREEN : "text.secondary",
                    fontWeight: isLive ? 700 : 400,
                    whiteSpace: "nowrap",
                  }
            }
            variant={isArriving ? "body2" : "h6"}
          >
            {isLive && !isArriving && (
              <SensorsRoundedIcon
                aria-hidden={true}
                data-testid={"live-icon"}
                sx={{ fontSize: 16, mr: 0.5, verticalAlign: "-2px" }}
              />
            )}
            {countdown}
          </Typography>
          {later.length > 0 && (
            <LaterTimes later={later} nowSeconds={nowSeconds} />
          )}
        </Box>
        {canExpand &&
          (expanded ? (
            <ExpandLessIcon color={"action"} />
          ) : (
            <ExpandMoreIcon color={"action"} />
          ))}
      </ListItemButton>
      {canExpand && (
        <Collapse in={expanded} unmountOnExit={true}>
          <ArrivalTrack
            arrival={arrival}
            nowSeconds={nowSeconds}
            stopId={stopId}
          />
        </Collapse>
      )}
    </Box>
  );
};
