import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RouteIcon from "@mui/icons-material/Route";
import { Box, Skeleton } from "@mui/material";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import * as React from "react";
import { Link } from "react-router-dom";
import { Stop, Trip } from "shared/api/generated/model";
import { RouteIdDisplay } from "shared/components/RouteIdDisplay/RouteIdDisplay";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { VehiclePosition, VehicleStopStatus } from "shared/types/interface.d";

dayjs.extend(relativeTime);

const getFormattedVehicleStopStatus = (vehicleStopStatus: string): string => {
  switch (vehicleStopStatus) {
    case VehicleStopStatus.IncomingAt:
      return "Incoming At";
    case VehicleStopStatus.InTransitTo:
      return "In Transit To";
    case VehicleStopStatus.StoppedAt:
      return "Stopped At";
    default:
      return "";
  }
};

export interface VehiclePopupContentProps {
  readonly vehiclePosition: VehiclePosition;
  readonly stop?: Stop;
  readonly stopLoading: boolean;
  readonly trip?: Trip;
  readonly tripLoading: boolean;
}

export const VehiclePopupContent: React.FunctionComponent<
  VehiclePopupContentProps
> = ({ vehiclePosition, stop, stopLoading, trip, tripLoading }) => {
  const { viewStatePathname, withPreservedSearch } = useViewStatePathname();
  return (
    <Box display={"flex"} flexDirection={"column"} gap={1} minWidth={275}>
      <Box
        alignItems={"center"}
        component={trip?.routeId ? Link : "div"}
        display={"flex"}
        gap={1}
        sx={{ color: "inherit", textDecoration: "none" }}
        to={`/route/${trip?.routeId}/direction/0${viewStatePathname}${withPreservedSearch()}`}
      >
        <RouteIcon />
        <RouteIdDisplay
          routeColor={trip?.route?.routeColor}
          routeId={trip?.routeId || ""}
        />
        <Typography
          component={"p"}
          fontSize={14}
          sx={
            trip?.routeId
              ? { "&:hover": { textDecoration: "underline" } }
              : undefined
          }
          variant={"body2"}
        >
          {tripLoading ? <Skeleton /> : trip?.route?.routeLongName}
        </Typography>
      </Box>
      <Typography display={"block"} variant={"body2"}>
        {vehiclePosition.currentStatus &&
          getFormattedVehicleStopStatus(vehiclePosition.currentStatus)}
      </Typography>
      <Box
        alignItems={"center"}
        component={vehiclePosition.stopId ? Link : "div"}
        display={"flex"}
        gap={1}
        sx={{ color: "inherit", textDecoration: "none" }}
        to={`/stop/${vehiclePosition.stopId}${viewStatePathname}${withPreservedSearch()}`}
      >
        <PlaceOutlinedIcon color={"neutral"} sx={{ fontSize: 20 }} />
        <Typography
          fontSize={16}
          fontWeight={600}
          sx={
            vehiclePosition.stopId
              ? { "&:hover": { textDecoration: "underline" } }
              : undefined
          }
          variant={"body2"}
        >
          {stopLoading ? <Skeleton width={300} /> : stop?.stopName}
        </Typography>
      </Box>
      <Typography alignSelf={"flex-end"} color={"textSecondary"} fontSize={14}>
        {"Updated "}
        {dayjs.unix(vehiclePosition.timestamp || 0).fromNow()}
      </Typography>
    </Box>
  );
};
