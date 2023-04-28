import { useNavigate, useParams } from "react-router-dom";
import { stopLoader, useDataFromLoader } from "../../../../../App";
import { Box, Slide } from "@mui/material";
import * as React from "react";
import { toBoolean } from "../../../Page";
import { StopInfoAndArrivalTimes } from "../../../../../components/StopInfoAndArrivalTimes/StopInfoAndArrivalTimes";

export const StopMenu = () => {
  const navigate = useNavigate();
  const { routeId, directionId } = useParams();
  const {
    data: { stop },
  } = useDataFromLoader(stopLoader);

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
          <StopInfoAndArrivalTimes
            stop={stop}
            routeId={Number(routeId) || 318}
            direction={toBoolean(directionId)}
            clearSelectedStopId={() => {
              navigate(-1);
            }}
          />
        </div>
      </Slide>
    </Box>
  );
};
