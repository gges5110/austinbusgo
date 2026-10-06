import AccessibleIcon from "@mui/icons-material/Accessible";
import NotAccessibleIcon from "@mui/icons-material/NotAccessible";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { Box, Divider, Tooltip, Typography } from "@mui/material";
import { useDataFromLoader } from "app/Router";
import { UpcomingList } from "features/nearby/components/UpcomingList";
import { useServerNow, useUpcoming } from "features/nearby/hooks/useUpcoming";
import { RoutesSelector } from "features/stop/components/RoutesSelector/RoutesSelector";
import { StopRoutes } from "features/stop/components/StopRoutes/StopRoutes";
import * as React from "react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AddToFavorites } from "shared/components/AddToFavorites/AddToFavorites";
import { BackButton } from "shared/components/BackButton/BackButton";
import { MenuPanel } from "shared/components/MenuPanel/MenuPanel";
import { ShareButton } from "shared/components/ShareButton/ShareButton";
import { useTitle } from "shared/hooks/UseTitle";

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

  const upcoming = useUpcoming(String(stop.stopId));
  const nowSeconds = useServerNow(upcoming.clockOffset);
  const arrivals = upcoming.data?.arrivals ?? [];
  const [expandedTripId, setExpandedTripId] = useState<string>();

  // Route filter: undefined shows every route. Opening the stop from a
  // route page starts filtered to that route.
  const [routeFilter, setRouteFilter] = useState<string[] | undefined>(
    routeId ? [routeId] : undefined
  );
  const routeOptions = arrivals.map(({ routeId, routeColor }) => ({
    routeId,
    routeColor,
  }));
  const routeIds = [...new Set(routeOptions.map((route) => route.routeId))];
  const filteredRouteIds = routeFilter?.filter((id) => routeIds.includes(id));
  const selectedRouteIds =
    filteredRouteIds && filteredRouteIds.length > 0
      ? filteredRouteIds
      : routeIds;
  const setSelectedRouteIds = (
    next: string[] | ((previous: string[]) => string[])
  ) => {
    const value = typeof next === "function" ? next(selectedRouteIds) : next;
    setRouteFilter(value.length >= routeIds.length ? undefined : value);
  };

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

        {routeIds.length > 1 && (
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
              routes={routeOptions}
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
          Next hour
        </Typography>
      </Box>
      <UpcomingList
        data={upcoming.data}
        expandedTripId={expandedTripId}
        nowSeconds={nowSeconds}
        onToggle={(tripId) =>
          setExpandedTripId((current) =>
            current === tripId ? undefined : tripId
          )
        }
        routeIds={routeFilter ? selectedRouteIds : undefined}
      />
    </MenuPanel>
  );
};
