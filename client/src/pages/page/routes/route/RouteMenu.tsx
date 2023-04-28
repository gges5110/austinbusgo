import { useNavigate, useParams } from "react-router-dom";
import { routeLoader, useDataFromLoader } from "../../../../App";
import {
  Box,
  Divider,
  IconButton,
  Slide,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { DirectionToggle } from "../../../../components/DirectionToggle/DirectionToggle";
import { StopsTimeline } from "../../../../components/StopsTimeline/StopsTimeline";
import * as React from "react";
import { toBoolean } from "../../Page";

export const RouteMenu = () => {
  const navigate = useNavigate();
  const loaderData = useDataFromLoader(routeLoader);
  const selectedRoute = loaderData?.route;
  const stops = loaderData?.stops;
  const distinctTrips = loaderData.distinctTrips;
  const { routeId, directionId } = useParams();

  return (
    <Box
      sx={{
        backgroundColor: "#FFF",
        overflowY: "auto",
        maxHeight: "80vh",
        width: "408px",
        m: 4,
        mt: 2,
        overflowX: "hidden",
        borderRadius: 2.5,
      }}
    >
      <Slide direction="right" in={true} mountOnEnter unmountOnExit>
        <div>
          <Box
            sx={{
              position: "sticky",
              top: 0,
              pt: 1,
              pl: 2,
              zIndex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              boxShadow: 3,
              backdropFilter: "blur(5px)",
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
              }}
            >
              <Tooltip
                title={"Back"}
                onClick={() => {
                  navigate(-1);
                }}
              >
                <IconButton>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <Box>
                <Typography variant="body1" gutterBottom>
                  {selectedRoute.routeId} {selectedRoute.routeLongName}
                </Typography>
                <DirectionToggle
                  direction={toBoolean(directionId)}
                  setDirection={(direction) => {
                    navigate(
                      `/routes/${routeId}/direction/${direction ? 1 : 0}`,
                      { replace: true }
                    );
                  }}
                  distinctTrips={distinctTrips}
                />
              </Box>
            </Box>
          </Box>

          <Divider />
          <Box sx={{ px: 0 }}>
            <StopsTimeline
              stops={stops}
              setSelectedStopId={(stopId) => {
                navigate(
                  `/routes/${routeId}/direction/${directionId}/stop/${stopId}`
                );
              }}
            />
          </Box>
        </div>
      </Slide>
    </Box>
  );
};
