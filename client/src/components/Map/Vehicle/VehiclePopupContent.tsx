import * as React from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import makeStyles from "@material-ui/core/styles/makeStyles";
import Typography from "@material-ui/core/Typography";
import { Skeleton } from "@material-ui/lab";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  VehiclePosition,
  VehicleStopStatus,
} from "../../../interfaces/interface.d";
import { StopQuery } from "../../../schemas/Stop.generated";
import { TripQuery } from "../../../schemas/Trip.generated";

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

const useStyles = makeStyles({
  root: {
    minWidth: 275,
  },
  title: {
    fontSize: 14,
  },
});

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
  const classes = useStyles();

  return (
    <Card className={classes.root} variant="outlined">
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
    </Card>
  );
};
