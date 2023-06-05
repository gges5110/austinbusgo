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
import { RouteIdDisplay } from "../../Shared/RouteIdDisplay/RouteIdDisplay";
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
    <Card variant={"outlined"}>
      <CardContent sx={{ minWidth: 275, borderRadius: 6 }}>
        <Box display={"flex"} flexDirection={"column"} gap={1}>
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
          <Box alignItems={"center"} display={"flex"} gap={1}>
            <PlaceOutlinedIcon color={"neutral"} sx={{ fontSize: 20 }} />
            <Typography fontSize={16} fontWeight={600} variant={"body2"}>
              {stopLoading ? <Skeleton width={300} /> : stop?.stop.stopName}
            </Typography>
          </Box>

          <Typography
            alignSelf={"flex-end"}
            color={"textSecondary"}
            fontSize={14}
          >
            {"Updated "}
            {dayjs.unix(vehiclePosition.timestamp || 0).fromNow()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
