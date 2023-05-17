import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { StopQuery } from "../../../schemas/Stop.generated";
import { TripQuery } from "../../../schemas/Trip.generated";
import { Box, Skeleton } from "@mui/material";
import {
  VehiclePosition,
  VehicleStopStatus,
} from "../../../interfaces/interface.d";
import { RouteIdDisplay } from "../../RouteIdDisplay/RouteIdDisplay";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RouteIcon from "@mui/icons-material/Route";

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

export const VehiclePopupContent: React.FunctionComponent<VehiclePopupContentProps> = ({
  vehiclePosition,
  stop,
  stopLoading,
  trip,
  tripLoading,
}) => {
  return (
    <Card variant="outlined">
      <CardContent sx={{ minWidth: 275, borderRadius: 6 }}>
        <Box display={"flex"} gap={1} flexDirection={"column"}>
          <Box display={"flex"} gap={1} alignItems={"center"}>
            <RouteIcon />
            <RouteIdDisplay
              routeColor={trip?.trip.route.routeColor}
              routeId={trip?.trip.routeId || ""}
            />
            <Typography variant="body2" component="p" fontSize={14}>
              {tripLoading ? <Skeleton /> : trip?.trip.route.routeLongName}
            </Typography>
          </Box>
          <Typography variant="body2" display={"block"}>
            {vehiclePosition.currentStatus &&
              getFormattedVehicleStopStatus(vehiclePosition.currentStatus)}
          </Typography>
          <Box display={"flex"} gap={1} alignItems={"center"}>
            <PlaceOutlinedIcon color={"neutral"} sx={{ fontSize: 20 }} />
            <Typography fontSize={16} variant="body2" fontWeight={600}>
              {stopLoading ? <Skeleton width={300} /> : stop?.stop.stopName}
            </Typography>
          </Box>
          <Typography
            fontSize={14}
            color="textSecondary"
            alignSelf={"flex-end"}
          >
            Updated {dayjs.unix(vehiclePosition.timestamp || 0).fromNow()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
