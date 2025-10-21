import { Link as RouterLink, useParams } from "react-router-dom";
import { Box, Button, Divider, Typography } from "@mui/material";
import * as React from "react";
import { useRef } from "react";
import { TripTimeline } from "../../components/Trip/TripTimeline/TripTimeline";
import {
  useDataFromLoader,
  useDataFromRouteLoader,
} from "../../../../app/Router";
import { MenuPanel } from "../../../../shared/components/Shared/MenuPanel/MenuPanel";
import { useTitle } from "../../../../shared/hooks/UseTitle";
import { stopLoader } from "../../../stop/pages/stop/StopLoader";
import { tripLoader } from "./TripLoader";
import { searchParamsDataLoader } from "../../../../pages/SearchParamsDataLoader";
import { useTripUpdateQuery } from "../../../../shared/api/schemas/TripUpdate.generated";
import { RouteOutlined } from "@mui/icons-material";
import { useViewStatePathname } from "../../../../shared/hooks/UseViewStatePathname";
import { AddToFavorites } from "../../../../shared/components/Shared/AddToFavorites/AddToFavorites";
import { BackButton } from "../../../../shared/components/Shared/BackButton/BackButton";
import { RouteDisplayBanner } from "../../../../shared/components/Shared/RouteDisplayBanner/RouteDisplayBanner";

export const TripMenu = () => {
  const { trip, stopTimes, tripUpdate } = useDataFromLoader(tripLoader);
  const stopData = useDataFromRouteLoader("stop", stopLoader);
  const stop = stopData?.stop;

  const params = useParams();
  const tripId = params["tripId"];

  useTripUpdateQuery(
    {
      tripId: tripId || "",
    },
    {
      refetchInterval: 15000,
    }
  );

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
            to={`${viewStatePathname}/route/${trip.routeId}/direction/${trip.directionId}`}
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
