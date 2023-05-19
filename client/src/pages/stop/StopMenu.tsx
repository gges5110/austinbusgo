import { useSearchParams } from "react-router-dom";
import * as React from "react";
import { useEffect } from "react";
import { useTitle } from "../../hooks/UseTitle";
import { useDataFromLoader } from "../../Router";
import { MenuPanel } from "../../components/Shared/MenuPanel/MenuPanel";
import { stopLoader } from "./StopLoader";
import { Box, Divider, Typography } from "@mui/material";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { AddToFavorites } from "../../components/Shared/AddToFavorites/AddToFavorites";
import { ShareButton } from "../../components/Shared/ShareButton/ShareButton";
import { RoutesSelector } from "../../components/Stop/RoutesSelector/RoutesSelector";
import { ArrivalTimeList } from "../../components/Stop/ArrivalTimeList/ArrivalTimeList";
import { useArrivalTimesQuery } from "../../schemas/ArrivalTimes.generated";
import { getDate } from "../../dateUtils";
import { useAtom } from "jotai";
import { selectedRouteIdsAtStopAtom } from "../../Atoms";
import { BackButton } from "../../components/Shared/BackButton/BackButton";

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
              alignItems={"center"}
              display={"flex"}
              gap={1}
              justifyContent={"center"}
            >
              <PlaceOutlinedIcon />
              <Typography variant={"subtitle1"}>{stop.stopName}</Typography>
            </Box>

            <Typography textAlign={"center"} variant={"subtitle2"}>
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
              arrivalTimes={arrivalTimes}
              selectedRouteIds={selectedRouteIds}
              setSelectedRouteIds={setSelectedRouteIds}
            />
          </Box>
        )}
      </Box>
      <ArrivalTimeList
        arrivalTimes={arrivalTimes}
        loading={isLoading}
        selectedRouteIds={selectedRouteIds}
        stop={stop}
      />
    </MenuPanel>
  );
};
