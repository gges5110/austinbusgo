import * as React from "react";
import { useArrivalTimesQuery } from "../../schemas/ArrivalTimes.generated";
import { getDate } from "../../pages/page/Page";
import { Box, Divider, IconButton, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ArrivalTimeList } from "./ArrivalTimeList/ArrivalTimeList";
import { StopQuery } from "../../schemas/Stop.generated";

interface StopInfoAndArrivalTimesProps {
  stop: StopQuery["stop"];

  clearSelectedStopId(): void;

  direction: boolean;
  routeId: number;
}

export const StopInfoAndArrivalTimes: React.FC<StopInfoAndArrivalTimesProps> = ({
  stop,
  routeId,
  direction,
  clearSelectedStopId,
}) => {
  const { data: arrivalTimesData, loading } = useArrivalTimesQuery({
    fetchPolicy: "network-only",
    variables: {
      stopId: String(stop.stopId),
      direction,
      routeId,
      date: getDate(),
    },
  });
  return (
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
            justifyContent: "flex-start",
            alignItems: "flex-start",
            gap: 1,
          }}
        >
          <Tooltip title={"Back"}>
            <IconButton onClick={clearSelectedStopId}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>

          <Box component={"div"}>
            <Typography variant="body1" gutterBottom>
              {stop.stopName}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Stop ID: {stop.stopId}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      <ArrivalTimeList
        arrivalTimes={arrivalTimesData?.arrivalTimes || []}
        arrivalTimeOnClick={() => {
          console.log("clicked");
        }}
        loading={loading}
      />
    </div>
  );
};
