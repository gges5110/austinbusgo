import { useNavigate, useSearchParams } from "react-router-dom";
import * as React from "react";
import { useTitle } from "../../hooks/UseTitle";
import { useDataFromLoader } from "../../Router";
import { MenuPanel } from "../../components/Shared/MenuPanel/MenuPanel";
import { stopLoader } from "./StopLoader";
import { Box, Divider, IconButton, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { AddToFavorites } from "../../components/Shared/AddToFavorites/AddToFavorites";
import { ShareButton } from "../../components/Shared/ShareButton/ShareButton";
import { RoutesSelector } from "../../components/Stop/StopInfoAndArrivalTimes/RoutesSelector/RoutesSelector";
import { ArrivalTimeList } from "../../components/Stop/StopInfoAndArrivalTimes/ArrivalTimeList/ArrivalTimeList";
import { useArrivalTimesQuery } from "../../schemas/ArrivalTimes.generated";
import { getDate } from "../../dateUtils";
import { useAtom } from "jotai";
import { selectedRouteIdsAtStopAtom } from "../../Atoms";
import { useEffect } from "react";

interface StopMenuProps {
  hideBackButton?: boolean;
}

export const StopMenu: React.FC<StopMenuProps> = ({ hideBackButton }) => {
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get("routeId") || "";
  const stopData = useDataFromLoader(stopLoader);
  const stop = stopData.stop;
  useTitle(`${stop.stopName} - Austin Bus Go`);

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
    <MenuPanel>
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
          {!hideBackButton && <BackButton />}

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
      <ArrivalTimeList
        arrivalTimes={arrivalTimes}
        stop={stop}
        loading={isLoading}
        selectedRouteIds={selectedRouteIds}
      />
    </MenuPanel>
  );
};

const BackButton = () => {
  const navigate = useNavigate();
  const onBack = () => {
    navigate(-1);
  };

  return (
    <Tooltip title={"Back"} sx={{ position: "absolute", left: "6px" }}>
      <IconButton onClick={onBack}>
        <ArrowBackIcon />
      </IconButton>
    </Tooltip>
  );
};
