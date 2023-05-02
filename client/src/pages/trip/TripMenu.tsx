import { useMatches, useNavigate } from "react-router-dom";
import { Params } from "@remix-run/router";
import {
  Box,
  Divider,
  IconButton,
  Slide,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import * as React from "react";
import {
  HandleType,
  stopLoader,
  tripLoader,
  useDataFromLoader,
} from "../../App";
import { TripTimeline } from "../../components/TripTimeline/TripTimeline";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { RouteIdDisplay } from "../../components/RouteIdDisplay";

export const TripMenu = () => {
  const { trip, stopTimes } = useDataFromLoader(tripLoader);
  const matches = useMatches() as {
    id: string;
    pathname: string;
    params: Params;
    data: unknown;
    handle: HandleType;
  }[];
  const stop = matches
    .filter((match) => Boolean(match.handle?.stop))
    .map((match) =>
      match.handle?.stop?.(match.data as Awaited<ReturnType<typeof stopLoader>>)
    )[0];

  const navigate = useNavigate();
  const onBack = () => {
    navigate(-1);
  };
  return (
    <Box
      sx={{
        backgroundColor: "#FFF",
        maxHeight: "82vh",
        width: "408px",
        m: 4,
        mt: 2,
        overflow: "hidden",
        borderRadius: 2.5,
      }}
    >
      <Slide direction="right" in={true} mountOnEnter unmountOnExit>
        <div>
          <Box
            sx={{
              py: 1,
              boxShadow: 2,
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                py: 1,
                position: "sticky",
                overflow: "hidden",
              }}
            >
              <Tooltip
                title={"Back"}
                sx={{ position: "absolute", left: "6px" }}
              >
                <IconButton onClick={onBack}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                  <DirectionsBusIcon />
                  <RouteIdDisplay
                    routeId={trip.routeId}
                    routeColor={trip.route.routeColor}
                  />
                  <Typography sx={{ fontSize: "18px" }}>
                    {trip.route.routeLongName}
                  </Typography>
                </Box>
                <Typography
                  variant={"subtitle1"}
                  sx={{ color: "gray", textAlign: "center" }}
                >
                  from {stop?.stopName}
                </Typography>
              </Box>
            </Box>

            <Divider />
            <TripTimeline stopTimes={stopTimes} stop={stop} trip={trip} />
          </Box>
        </div>
      </Slide>
    </Box>
  );
};
