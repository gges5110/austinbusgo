import { RouteOutlined } from "@mui/icons-material";
import { Box, Button, Divider, Typography } from "@mui/material";
import { useDataFromLoader, useDataFromRouteLoader } from "app/Router";
import { stopLoader } from "features/stop/pages/stop/StopLoader";
import { TripTimeline } from "features/trip/components/Trip/TripTimeline/TripTimeline";
import * as React from "react";
import { useRef } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useTripUpdate } from "shared/api/generated/api";
import { AddToFavorites } from "shared/components/AddToFavorites/AddToFavorites";
import { BackButton } from "shared/components/BackButton/BackButton";
import { MenuPanel } from "shared/components/MenuPanel/MenuPanel";
import { RouteDisplayBanner } from "shared/components/RouteDisplayBanner/RouteDisplayBanner";
import { useTitle } from "shared/hooks/UseTitle";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { searchParamsDataLoader } from "shared/loaders/searchParamsDataLoader";

import { tripLoader } from "./TripLoader";

export const TripMenu = () => {
  const { trip, stopTimes, tripUpdate } = useDataFromLoader(tripLoader);
  const stop = useDataFromRouteLoader("stop", stopLoader);

  const params = useParams();
  const tripId = params["tripId"];

  useTripUpdate(tripId || "", {
    query: {
      refetchInterval: 15000,
    },
  });

  const searchParamsData = useDataFromRouteLoader(
    "searchParams",
    searchParamsDataLoader
  );
  const vehiclePosition = searchParamsData?.vehiclePositions?.find(
    (v) => v.trip?.tripId === trip.tripId
  );

  const { viewStatePathname } = useViewStatePathname();

  const tripName =
    trip.tripHeadsign?.split("-")[trip.tripHeadsign?.split("-").length - 1] ||
    "";

  useTitle(`${tripName} - Austin Bus Go`);

  const containerRef = useRef<HTMLDivElement | null>(null);
  return (
    <MenuPanel innerRef={containerRef}>
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
          <BackButton />
          <Box sx={{ flex: 1 }}>
            <RouteDisplayBanner
              routeColor={trip.route.routeColor}
              routeId={trip.routeId}
              routeName={tripName}
              useBusIcon={true}
            />
            <Typography textAlign={"center"} variant={"subtitle2"}>
              from {stop?.stopName}
            </Typography>
          </Box>
        </Box>

        <Divider />
        <Box display={"flex"} px={"22px"} py={"10px"}>
          <Button
            component={RouterLink}
            sx={{ textTransform: "none" }}
            to={`/route/${trip.routeId}/direction/${trip.directionId}${viewStatePathname}`}
          >
            <Box
              alignItems={"center"}
              display={"flex"}
              flexDirection={"column"}
            >
              <RouteOutlined />
              <Typography sx={{ textAlign: "center", fontSize: "14px" }}>
                Show route
              </Typography>
            </Box>
          </Button>
          <AddToFavorites value={trip.route} />
        </Box>
        <Divider />
        <TripTimeline
          containerRef={containerRef}
          stop={stop}
          stopTimes={stopTimes}
          trip={trip}
          tripUpdate={tripUpdate}
          vehiclePosition={vehiclePosition}
        />
      </Box>
    </MenuPanel>
  );
};
