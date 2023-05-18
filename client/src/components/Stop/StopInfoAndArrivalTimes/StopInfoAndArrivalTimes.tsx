import * as React from "react";
import { useEffect } from "react";
import { useArrivalTimesQuery } from "../../../schemas/ArrivalTimes.generated";
import { Box, Divider, IconButton, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ArrivalTimeList } from "./ArrivalTimeList/ArrivalTimeList";
import { useAtom } from "jotai";
import { selectedRouteIdsAtStopAtom } from "../../../Atoms";
import { RoutesSelector } from "./RoutesSelector/RoutesSelector";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { StopQuery } from "../../../schemas/Stop.generated";
import { getDate } from "../../../dateUtils";
import { AddToFavorites } from "../../AddToFavorites/AddToFavorites";
import { ShareButton } from "../../ShareButton/ShareButton";

interface StopInfoAndArrivalTimesProps {
  stop: StopQuery["stop"];

  routeId?: string;
  hideBackButton?: boolean;

  onBack(): void;
}

export const StopInfoAndArrivalTimes: React.FC<StopInfoAndArrivalTimesProps> = ({
  stop,
  routeId,
  hideBackButton,
  onBack,
}) => {
  const { data: arrivalTimesData, isLoading } = useArrivalTimesQuery(
    {
      stopId: String(stop.stopId),
      date: getDate(),
    },
    {
      onSuccess: (data) => {
        const routeIds =
          data.arrivalTimes?.map((arrivalTime) => arrivalTime.trip.routeId) ||
          [];
        setSelectedRouteInitialValues(routeIds);
      },
    }
  );

  const arrivalTimes = arrivalTimesData?.arrivalTimes || [];

  const [selectedRouteIds, setSelectedRouteIds] = useAtom(
    selectedRouteIdsAtStopAtom
  );

  const routeIds =
    arrivalTimesData?.arrivalTimes?.map(
      (arrivalTime) => arrivalTime.trip.routeId
    ) || [];
  const uniqueRouteIds =
    routeIds
      ?.filter((item, pos, arr) => arr.indexOf(item) == pos)
      .sort((a, b) => {
        return Number(a) - Number(b);
      }) || [];

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
          boxShadow: 2,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            py: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {!hideBackButton && (
            <Tooltip title={"Back"} sx={{ position: "absolute", left: "6px" }}>
              <IconButton onClick={onBack}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          )}

          <Box sx={{ flex: 1 }}>
            <Box
              display={"flex"}
              gap={1}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <PlaceOutlinedIcon />
              <Typography sx={{ fontSize: "18px" }}>{stop.stopName}</Typography>
            </Box>

            <Typography
              sx={{ color: "gray", textAlign: "center", fontSize: "15px" }}
            >
              Stop ID: {stop.stopId}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <Box display={"flex"} px={"22px"} py={"10px"}>
          <AddToFavorites value={stop} />
          <ShareButton />
        </Box>

        {!isLoading && arrivalTimes.length > 0 && uniqueRouteIds.length > 1 && (
          <Box
            sx={{
              overflowX: "auto",
              py: 1,
              pl: 2,
              pr: 1,
            }}
          >
            <RoutesSelector
              selectedRouteIds={selectedRouteIds}
              setSelectedRouteIds={setSelectedRouteIds}
              arrivalTimes={arrivalTimes}
            />
          </Box>
        )}
      </Box>

      <Box>
        <ArrivalTimeList
          arrivalTimes={arrivalTimes}
          stop={stop}
          loading={isLoading}
          selectedRouteIds={selectedRouteIds}
        />
      </Box>
    </div>
  );
};
