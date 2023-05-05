import * as React from "react";
import {
  ArrivalTimesQuery,
  useArrivalTimesQuery,
} from "../../../schemas/ArrivalTimes.generated";
import { getDate } from "../../../pages/page/RootLayout";
import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ArrivalTimeList } from "./ArrivalTimeList/ArrivalTimeList";
import { StopQuery } from "../../../schemas/Stop.generated";
import { useEffect } from "react";
import { ArrivalTime } from "../../../interfaces/interface.d";
import ClearIcon from "@mui/icons-material/Clear";
import { useAtom } from "jotai";
import { selectedRouteIdsAtStopAtom } from "../../../Atoms";

interface StopInfoAndArrivalTimesProps {
  stop: StopQuery["stop"];

  routeId?: string;
  hideBackButton?: boolean;

  onBack(): void;

  arrivalTimeOnClick(arrivalTime: ArrivalTime): void;
}

export const StopInfoAndArrivalTimes: React.FC<StopInfoAndArrivalTimesProps> = ({
  stop,
  routeId,
  hideBackButton,
  onBack,
  arrivalTimeOnClick,
}) => {
  const { data: arrivalTimesData, loading } = useArrivalTimesQuery({
    variables: {
      stopId: String(stop.stopId),
      date: getDate(),
    },
    onCompleted: (data) => {
      const routeIds =
        data.arrivalTimes?.map((arrivalTime) => arrivalTime.trip.routeId) || [];
      setSelectedRouteInitialValues(routeIds);
    },
  });

  const arrivalTimes = arrivalTimesData?.arrivalTimes || [];

  const [selectedRouteIds, setSelectedRouteIds] = useAtom(
    selectedRouteIdsAtStopAtom
  );

  const setSelectedRouteInitialValues = (routeIds: string[]) => {
    const uniqueRouteIds =
      routeIds
        ?.filter((item, pos, arr) => arr.indexOf(item) == pos)
        .sort((a, b) => {
          return Number(a) - Number(b);
        }) || [];

    if (routeId && uniqueRouteIds.includes(routeId)) {
      setSelectedRouteIds([routeId]);
    } else {
      setSelectedRouteIds(uniqueRouteIds);
    }
  };

  useEffect(() => {
    const routeIds = arrivalTimes.map(
      (arrivalTime) => arrivalTime.trip.routeId
    );
    setSelectedRouteInitialValues(routeIds);
  }, []);

  return (
    <div>
      <Box
        sx={{
          py: 1,
          pl: 2,
          pr: 1,
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

        {!loading && arrivalTimes.length > 0 && (
          <Box sx={{ overflowX: "auto", py: 1 }}>
            <RoutesSelector
              selectedRouteIds={selectedRouteIds}
              setSelectedRouteIds={setSelectedRouteIds}
              arrivalTimes={arrivalTimes}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ overflowY: "auto", maxHeight: "calc(80vh - 113px)" }}>
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

interface RoutesSelectorProps {
  selectedRouteIds: Array<string>;

  setSelectedRouteIds: (
    arg1: ((prevState: string[]) => string[]) | string[]
  ) => void;

  arrivalTimes: ArrivalTimesQuery["arrivalTimes"];
}

const RoutesSelector: React.FC<RoutesSelectorProps> = ({
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
    <Box
      display={"flex"}
      justifyContent={"space-between"}
      alignItems={"center"}
    >
      <Box sx={{ display: "flex", gap: 1 }}>
        {uniqueRouteIds.map((uniqueRouteId) => {
          const routeColor = arrivalTimes?.find(
            (arrivalTime) => arrivalTime.trip.routeId === uniqueRouteId
          )?.trip.route.routeColor;
          const isSelected = selectedRouteIds.includes(uniqueRouteId);
          // TODO: fix hover styles
          return (
            <Button
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
            >
              <Typography sx={{ fontWeight: "bold" }}>
                {uniqueRouteId}
              </Typography>
            </Button>
          );
        })}
      </Box>
      {uniqueRouteIds.length !== selectedRouteIds.length && (
        <IconButton sx={{ padding: "4px" }}>
          <ClearIcon
            sx={{ fontSize: 16 }}
            onClick={() => {
              clearSelection();
            }}
          />
        </IconButton>
      )}
    </Box>
  );
};
