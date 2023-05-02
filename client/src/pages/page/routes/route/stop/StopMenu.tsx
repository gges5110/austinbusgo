import { useLocation, useNavigate, useParams } from "react-router-dom";
import { stopLoader, useDataFromLoader } from "../../../../../App";
import { Box, Slide } from "@mui/material";
import * as React from "react";
import { StopInfoAndArrivalTimes } from "../../../../../components/StopInfoAndArrivalTimes/StopInfoAndArrivalTimes";
import { useTitle } from "../../../../../hooks/UseTitle";

interface StopMenuProps {
  hideBackButton?: boolean;
}

export const StopMenu: React.FC<StopMenuProps> = ({ hideBackButton }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { routeId } = useParams();
  const {
    data: { stop },
  } = useDataFromLoader(stopLoader);
  useTitle(`${stop.stopName} - Austin Bus Go`);

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
          <StopInfoAndArrivalTimes
            stop={stop}
            routeId={routeId}
            onBack={() => {
              navigate(-1);
            }}
            arrivalTimeOnClick={(arrivalTime) => {
              navigate(`${location.pathname}/trips/${arrivalTime.trip.tripId}`);
            }}
            hideBackButton={hideBackButton}
          />
        </div>
      </Slide>
    </Box>
  );
};
