import { ArrivalTimesQuery } from "../../../schemas/ArrivalTimes.generated";
import * as React from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

interface RoutesSelectorProps {
  selectedRouteIds: Array<string>;

  setSelectedRouteIds: (
    arg1: ((prevState: string[]) => string[]) | string[]
  ) => void;

  arrivalTimes: ArrivalTimesQuery["arrivalTimes"];
}

export const RoutesSelector: React.FC<RoutesSelectorProps> = ({
  selectedRouteIds,
  setSelectedRouteIds,
  arrivalTimes,
}) => {
  const routeIds = arrivalTimes?.map((arrivalTime) => arrivalTime.trip.routeId);
  const uniqueRouteIds =
    routeIds
      ?.filter((item, pos, arr) => arr.indexOf(item) == pos)
      .sort((a, b) => {
        return Number(a) - Number(b);
      }) || [];
  const clearSelection = () => {
    setSelectedRouteIds(uniqueRouteIds);
  };
  return (
    <Box alignItems={"center"} display={"flex"} justifyContent={"flex-start"}>
      <Box sx={{ display: "flex", gap: 1 }}>
        {uniqueRouteIds.map((uniqueRouteId) => {
          const routeColor = arrivalTimes?.find(
            (arrivalTime) => arrivalTime.trip.routeId === uniqueRouteId
          )?.trip.route.routeColor;
          const isSelected = selectedRouteIds.includes(uniqueRouteId);
          // TODO: fix hover styles
          return (
            <Button
              key={uniqueRouteId}
              onClick={() => {
                setSelectedRouteIds((prevState) => {
                  if (prevState.length === uniqueRouteIds.length) {
                    return [uniqueRouteId];
                  } else if (
                    prevState.includes(uniqueRouteId) &&
                    prevState.length > 1
                  ) {
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
              sx={{
                backgroundColor: `#${routeColor}`,
                "&:hover": {
                  backgroundColor: `#${routeColor}`,
                  opacity: isSelected ? "80%" : "40%",
                },
                color: "white",
                width: "fit-content",
                height: "fit-content",
                px: 1,
                py: 0,
                minWidth: 0,
                borderRadius: 1,
                opacity: isSelected ? "100%" : "50%",
              }}
            >
              <Typography sx={{ fontWeight: "bold" }}>
                {uniqueRouteId}
              </Typography>
            </Button>
          );
        })}
      </Box>
      {uniqueRouteIds.length !== selectedRouteIds.length && (
        <IconButton
          onClick={() => {
            clearSelection();
          }}
          sx={{ padding: "4px" }}
        >
          <ClearIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}
    </Box>
  );
};
