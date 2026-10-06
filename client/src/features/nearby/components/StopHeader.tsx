import PushPinIcon from "@mui/icons-material/PushPin";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { StopWithDistance } from "features/nearby/hooks/useNearestStop";
import { formatDistance } from "features/nearby/utils/geo";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Stop } from "shared/api/generated/model";

/** Data older than this is flagged as stale */
const STALE_AFTER_SECONDS = 60;

interface StopHeaderProps {
  alternates: StopWithDistance[];
  distance?: number;
  pinned: boolean;
  /** Show the other-stops chips without needing a tap (poor GPS accuracy) */
  showAlternates: boolean;
  stop: Stop;
  /** Seconds since the last successful refresh */
  updatedSecondsAgo?: number;
}

export const StopHeader: React.FC<StopHeaderProps> = ({
  alternates,
  distance,
  pinned,
  showAlternates,
  stop,
  updatedSecondsAgo,
}) => {
  const navigate = useNavigate();
  const stale =
    updatedSecondsAgo !== undefined && updatedSecondsAgo > STALE_AFTER_SECONDS;
  const [alternatesOpen, setAlternatesOpen] = React.useState(showAlternates);
  React.useEffect(() => {
    if (showAlternates) setAlternatesOpen(true);
  }, [showAlternates]);

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, py: 1.5 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component={"h1"} noWrap={true} variant={"h6"}>
            {stop.stopName}
          </Typography>
          <Typography color={"text.secondary"} variant={"body2"}>
            Stop {stop.stopCode ?? stop.stopId}
            {distance !== undefined && ` · ${formatDistance(distance)} away`}
            {updatedSecondsAgo !== undefined && (
              <Box
                component={"span"}
                sx={{ color: stale ? "warning.main" : undefined }}
              >
                {" "}
                · updated {Math.round(updatedSecondsAgo)} s ago
              </Box>
            )}
          </Typography>
        </Box>
        {pinned ? (
          <Tooltip title={"Unpin: follow my location"}>
            <IconButton
              aria-label={"Unpin stop and follow my location"}
              color={"primary"}
              onClick={() => navigate("/nearby")}
            >
              <PushPinIcon />
            </IconButton>
          </Tooltip>
        ) : (
          alternates.length > 0 && (
            <Tooltip title={"Other stops nearby"}>
              <IconButton
                aria-expanded={alternatesOpen}
                aria-label={"Other stops nearby"}
                onClick={() => setAlternatesOpen(!alternatesOpen)}
              >
                <SwapHorizIcon />
              </IconButton>
            </Tooltip>
          )
        )}
      </Box>
      {!pinned && alternatesOpen && alternates.length > 0 && (
        <Stack direction={"row"} sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
          {alternates.map(({ stop: alternate, distance: altDistance }) => (
            <Chip
              key={alternate.stopId}
              label={`${alternate.stopName} · ${formatDistance(altDistance)}`}
              onClick={() => navigate(`/nearby/stop/${alternate.stopId}`)}
              size={"small"}
              variant={"outlined"}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};
