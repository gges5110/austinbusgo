import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Collapse, ListItemButton, Typography } from "@mui/material";
import { ArrivalTrack } from "features/nearby/components/ArrivalTrack";
import {
  countdownLabel,
  distanceLabel,
  formatHeadsign,
} from "features/nearby/utils/countdown";
import * as React from "react";
import { UpcomingArrival } from "shared/api/generated/model";
import { RouteIdDisplay } from "shared/components/RouteIdDisplay/RouteIdDisplay";

interface UpcomingRowProps {
  arrival: UpcomingArrival;
  expanded: boolean;
  nowSeconds: number;
  onToggle: () => void;
  stopId: string;
}

export const LIVE_GREEN = "#0a8a3a";

export const UpcomingRow: React.FC<UpcomingRowProps> = ({
  arrival,
  expanded,
  nowSeconds,
  onToggle,
  stopId,
}) => {
  const isLive = arrival.status !== "scheduled";
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
        <Typography
          aria-label={isLive ? `${countdown}, live` : `${countdown}, scheduled`}
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
          {countdown}
        </Typography>
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
