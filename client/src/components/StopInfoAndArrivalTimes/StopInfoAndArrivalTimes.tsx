import * as React from "react";
import { useArrivalTimesQuery } from "../../schemas/ArrivalTimes.generated";
import { getDate } from "../../pages/page/Page";
import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ArrivalTimeList } from "./ArrivalTimeList/ArrivalTimeList";
import { StopQuery } from "../../schemas/Stop.generated";
import { useState } from "react";
import { ArrivalTime } from "../../interfaces/interface.d";

interface StopInfoAndArrivalTimesProps {
  stop: StopQuery["stop"];

  direction: boolean;
  routeId: number;
  hideBackButton?: boolean;
  onBack(): void;

  arrivalTimeOnClick(arrivalTime: ArrivalTime): void;
}

export const StopInfoAndArrivalTimes: React.FC<StopInfoAndArrivalTimesProps> = ({
  stop,
  routeId,
  direction,
  hideBackButton,
  onBack,
  arrivalTimeOnClick,
}) => {
  const { data: arrivalTimesData, loading } = useArrivalTimesQuery({
    fetchPolicy: "network-only",
    variables: {
      stopId: String(stop.stopId),
      direction,
      routeId,
      date: getDate(),
    },
    onCompleted: (data) => {
      const routeIds = data.arrivalTimes?.map(
        (arrivalTime) => arrivalTime.trip.routeId
      );
      const uniqueRouteIds =
        routeIds?.filter((item, pos, arr) => arr.indexOf(item) == pos) || [];
      setSelectedRouteIds(uniqueRouteIds);
    },
  });

  const arrivalTimes = arrivalTimesData?.arrivalTimes || [];

  const routeIds = arrivalTimes.map((arrivalTime) => arrivalTime.trip.routeId);
  const uniqueRouteIds =
    routeIds?.filter((item, pos, arr) => arr.indexOf(item) == pos) || [];
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>(
    uniqueRouteIds
  );

  return (
    <div>
      <Box
        sx={{
          py: 1,
          pl: 2,
          boxShadow: 2,
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
          {!hideBackButton && (
            <Tooltip title={"Back"}>
              <IconButton onClick={onBack}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          )}

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
      {!loading && arrivalTimes.length > 0 && (
        <Box sx={{ overflowX: "auto", py: 1, px: 1, boxShadow: 1 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            {uniqueRouteIds.map((uniqueRouteId) => (
              <Button
                key={uniqueRouteId}
                size="small"
                variant={
                  selectedRouteIds.includes(uniqueRouteId)
                    ? "contained"
                    : "outlined"
                }
                color={"primary"}
                sx={{ my: 1 }}
                onClick={() => {
                  setSelectedRouteIds((prevState) => {
                    if (prevState.includes(uniqueRouteId)) {
                      const newArr = [...prevState];
                      newArr.splice(newArr.indexOf(uniqueRouteId), 1);
                      return newArr;
                    } else {
                      const newArr = [...prevState];
                      newArr.push(uniqueRouteId);
                      return newArr;
                    }
                  });
                }}
              >
                {uniqueRouteId}
              </Button>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ overflowY: "auto", maxHeight: "80vh" }}>
        <ArrivalTimeList
          arrivalTimes={arrivalTimes}
          arrivalTimeOnClick={arrivalTimeOnClick}
          loading={loading}
          selectedRouteIds={selectedRouteIds}
        />
      </Box>
    </div>
  );
};
