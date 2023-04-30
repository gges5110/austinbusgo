import { useNavigate, useParams } from "react-router-dom";
import { routeLoader, useDataFromLoader } from "../../../../App";
import { Box, Slide } from "@mui/material";
import { DirectionToggle } from "../../../../components/DirectionToggle/DirectionToggle";
import { StopsTimeline } from "../../../../components/StopsTimeline/StopsTimeline";
import * as React from "react";
import { toBoolean } from "../../Page";

export const RouteMenu = () => {
  const navigate = useNavigate();
  const { stops, distinctTrips } = useDataFromLoader(routeLoader);
  const { routeId, directionId } = useParams();

  return (
    <Box
      sx={{
        backgroundColor: "#FFF",
        maxHeight: "80vh",
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
              pl: 4,
              boxShadow: 2,
              width: "100%",
            }}
          >
            <DirectionToggle
              direction={toBoolean(directionId)}
              setDirection={(direction) => {
                navigate(
                  `/@30.3116707,-97.7385137,12.89z/routes/${routeId}/direction/${
                    direction ? 1 : 0
                  }`,
                  {
                    replace: true,
                  }
                );
              }}
              distinctTrips={distinctTrips}
            />
          </Box>

          <Box sx={{ overflowY: "auto", maxHeight: "80vh" }}>
            <StopsTimeline
              stops={stops}
              setSelectedStopId={(stopId) => {
                navigate(
                  `/@30.3116707,-97.7385137,12.89z/routes/${routeId}/direction/${directionId}/stops/${stopId}`
                );
              }}
            />
          </Box>
        </div>
      </Slide>
    </Box>
  );
};
