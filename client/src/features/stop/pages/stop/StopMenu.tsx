import AccessibleIcon from "@mui/icons-material/Accessible";
import NotAccessibleIcon from "@mui/icons-material/NotAccessible";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { Box, Divider, Tooltip, Typography } from "@mui/material";
import { useDataFromLoader } from "app/Router";
import { ArrivalTimeList } from "features/stop/components/ArrivalTimeList/ArrivalTimeList";
import { RoutesSelector } from "features/stop/components/RoutesSelector/RoutesSelector";
import { StopRoutes } from "features/stop/components/StopRoutes/StopRoutes";
import { useAtom } from "jotai";
import * as React from "react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useArrivalTimes } from "shared/api/generated/api";
import { AddToFavorites } from "shared/components/AddToFavorites/AddToFavorites";
import { BackButton } from "shared/components/BackButton/BackButton";
import { MenuPanel } from "shared/components/MenuPanel/MenuPanel";
import { ShareButton } from "shared/components/ShareButton/ShareButton";
import { useTitle } from "shared/hooks/UseTitle";

import { selectedRouteIdsAtStopAtom } from "shared/state/atoms";
import { getDate } from "shared/utils/dateUtils";
import { stopLoader } from "./StopLoader";

interface StopMenuProps {
  hideBackButton?: boolean;
}

const WheelchairBoardingIcon: React.FC<{
  wheelchairBoarding?: number | null;
}> = ({ wheelchairBoarding }) => {
  if (wheelchairBoarding === 1) {
    return (
      <Tooltip title={"Wheelchair accessible"}>
        <AccessibleIcon color={"success"} fontSize={"small"} />
      </Tooltip>
    );
  }
  if (wheelchairBoarding === 2) {
    return (
      <Tooltip title={"Not wheelchair accessible"}>
        <NotAccessibleIcon color={"disabled"} fontSize={"small"} />
      </Tooltip>
    );
  }
  return null;
};

export const StopMenu: React.FC<StopMenuProps> = ({ hideBackButton }) => {
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get("routeId") || "";
  const stop = useDataFromLoader(stopLoader);
  useTitle(`${stop.stopName} - Austin Bus Go`);

  const { data: arrivalTimesData, isLoading } = useArrivalTimes(
    String(stop.stopId),
    {
      date: getDate(),
    },
    {
      query: {
        onSuccess: (data) => {
          const routeIds =
            data?.map((arrivalTime) => arrivalTime.trip.routeId) || [];
          setSelectedRouteInitialValues(routeIds);
        },
      },
    }
  );

  const arrivalTimes = arrivalTimesData || [];

  const [selectedRouteIds, setSelectedRouteIds] = useAtom(
    selectedRouteIdsAtStopAtom
  );

  const routeIds =
    arrivalTimesData?.map((arrivalTime) => arrivalTime.trip.routeId) || [];
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
              sx={{
                alignItems: "center",
                display: "flex",
                gap: 1,
                justifyContent: "center",
              }}
            >
              <PlaceOutlinedIcon />
              <Typography variant={"subtitle1"}>{stop.stopName}</Typography>
              <WheelchairBoardingIcon
                wheelchairBoarding={stop.wheelchairBoarding}
              />
            </Box>

            <Typography
              sx={{
                textAlign: "center",
              }}
              variant={"subtitle2"}
            >
              Stop ID: {stop.stopId}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            px: "22px",
            py: "10px",
          }}
        >
          <AddToFavorites value={stop} />
          <ShareButton />
        </Box>

        <Divider />
        <StopRoutes routes={stop.routes} />

        {!isLoading && arrivalTimes.length > 0 && uniqueRouteIds.length > 1 && (
          <Box
            sx={{
              overflowX: "auto",
              py: 1,
              pl: 2,
              pr: 1,
            }}
          >
            <Typography
              sx={{
                color: "text.secondary",
                mb: 0.5,
              }}
              variant={"caption"}
            >
              Filter by route
            </Typography>
            <RoutesSelector
              arrivalTimes={arrivalTimes}
              selectedRouteIds={selectedRouteIds}
              setSelectedRouteIds={setSelectedRouteIds}
            />
          </Box>
        )}
      </Box>
      <Box
        sx={{
          pt: 1,
          px: 2,
        }}
      >
        <Typography
          sx={{
            color: "text.secondary",
          }}
          variant={"caption"}
        >
          Upcoming arrivals
        </Typography>
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
