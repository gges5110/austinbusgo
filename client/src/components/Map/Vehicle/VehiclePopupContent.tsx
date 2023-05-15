import * as React from "react";
import { styled } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { StopQuery } from "../../../schemas/Stop.generated";
import { TripQuery } from "../../../schemas/Trip.generated";
import { Skeleton } from "@mui/material";
import {
  VehiclePosition,
  VehicleStopStatus,
} from "../../../interfaces/interface.d";

const PREFIX = "VehiclePopupContent";

const classes = {
  root: `${PREFIX}-root`,
  title: `${PREFIX}-title`,
};

const StyledCard = styled(Card)({
  [`&.${classes.root}`]: {
    minWidth: 275,
  },
  [`& .${classes.title}`]: {
    fontSize: 14,
  },
});

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
    <StyledCard className={classes.root} variant="outlined">
      <CardContent>
        <Typography className={classes.title} color="textSecondary">
          {vehiclePosition.trip?.routeId || ""}
        </Typography>
        <Typography variant="body2" component="p" display={"inline"}>
          {tripLoading ? <Skeleton /> : trip?.trip.tripHeadsign}
        </Typography>
        <Typography variant="body2" display={"block"}>
          {vehiclePosition.currentStatus &&
            getFormattedVehicleStopStatus(vehiclePosition.currentStatus)}
        </Typography>{" "}
        <Typography variant="body2" display={"block"}>
          {stopLoading ? <Skeleton width={300} /> : stop?.stop.stopName}
        </Typography>
        <Typography className={classes.title} color="textSecondary">
          Updated {dayjs.unix(vehiclePosition.timestamp || 0).fromNow()}
        </Typography>
      </CardContent>
    </StyledCard>
  );
};
