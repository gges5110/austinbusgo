import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RouteIcon from "@mui/icons-material/Route";
import { Box, Skeleton } from "@mui/material";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import * as React from "react";
import { Link } from "react-router-dom";
import { StopQuery } from "shared/api/schemas/Stop.generated";
import { TripQuery } from "shared/api/schemas/Trip.generated";
import { RouteIdDisplay } from "shared/components/RouteIdDisplay/RouteIdDisplay";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { VehiclePosition, VehicleStopStatus } from "shared/types/interface.d";

dayjs.extend(relativeTime);

const getFormattedVehicleStopStatus = (
  vehicleStopStatus: VehicleStopStatus
): string => {
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
  readonly stop?: StopQuery;
  readonly stopLoading: boolean;
  readonly trip?: TripQuery;
  readonly tripLoading: boolean;
}

export const VehiclePopupContent: React.FunctionComponent<
  VehiclePopupContentProps
> = ({ vehiclePosition, stop, stopLoading, trip, tripLoading }) => {
  const { viewStatePathname, withPreservedSearch } = useViewStatePathname();
  return (
    <Box display={"flex"} flexDirection={"column"} gap={1} minWidth={275}>
      <Box alignItems={"center"} display={"flex"} gap={1}>
        <RouteIcon />
        <RouteIdDisplay
          routeColor={trip?.trip.route.routeColor}
          routeId={trip?.trip.routeId || ""}
        />
        <Typography component={"p"} fontSize={14} variant={"body2"}>
          {tripLoading ? <Skeleton /> : trip?.trip.route.routeLongName}
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
          {stopLoading ? <Skeleton width={300} /> : stop?.stop.stopName}
        </Typography>
      </Box>
      <Typography alignSelf={"flex-end"} color={"textSecondary"} fontSize={14}>
        {"Updated "}
        {dayjs.unix(vehiclePosition.timestamp || 0).fromNow()}
      </Typography>
    </Box>
  );
};
