import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import * as React from "react";
import { useRef } from "react";
import { TripTimeline } from "../../components/Trip/TripTimeline/TripTimeline";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { RouteIdDisplay } from "../../components/RouteIdDisplay/RouteIdDisplay";
import { useDataFromLoader, useDataFromRouteLoader } from "../../Router";
import { MenuPanel } from "../../components/MenuPanel";
import { useTitle } from "../../hooks/UseTitle";
import { stopLoader } from "../stop/StopLoader";
import { tripLoader } from "./TripLoader";
import { searchParamsDataLoader } from "../SearchParamsDataLoader";
import { useTripUpdateQuery } from "../../schemas/TripUpdate.generated";
import { RouteOutlined } from "@mui/icons-material";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";
import { AddToFavorites } from "../../components/AddToFavorites/AddToFavorites";

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
  const navigate = useNavigate();
  const onBack = () => {
    navigate(-1);
  };

  const tripName = trip.tripHeadsign?.split("-")[
    trip.tripHeadsign?.split("-").length - 1
  ];

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
          <Tooltip title={"Back"} sx={{ position: "absolute", left: "6px" }}>
            <IconButton onClick={onBack}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
              <DirectionsBusIcon />
              <RouteIdDisplay
                routeId={trip.routeId}
                routeColor={trip.route.routeColor}
              />
              <Typography sx={{ fontSize: "18px" }}>{tripName}</Typography>
            </Box>
            <Typography
              sx={{ color: "gray", textAlign: "center", fontSize: "16px" }}
            >
              from {stop?.stopName}
            </Typography>
          </Box>
        </Box>

        <Divider />
        <Box display={"flex"} px={"22px"} py={"10px"}>
          <Button
            sx={{ textTransform: "none" }}
            component={RouterLink}
            to={`${viewStatePathname}/route/${trip.routeId}/direction/${trip.directionId}`}
          >
            <Box
              display={"flex"}
              flexDirection={"column"}
              alignItems={"center"}
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
          vehiclePosition={vehiclePosition}
          tripUpdate={tripUpdate}
          stopTimes={stopTimes}
          stop={stop}
          trip={trip}
          containerRef={containerRef}
        />
      </Box>
    </MenuPanel>
  );
};
