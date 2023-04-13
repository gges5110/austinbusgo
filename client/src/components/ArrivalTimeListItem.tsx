import {
  Button,
  createStyles,
  ListItem,
  ListItemText,
  Typography,
} from "@material-ui/core";
import { green, red } from "@material-ui/core/colors";
import { makeStyles } from "@material-ui/core/styles";
import AccessibleIcon from "@material-ui/icons/Accessible";
import DirectionsBikeIcon from "@material-ui/icons/DirectionsBike";
import DirectionsBusIcon from "@material-ui/icons/DirectionsBus";
import dayjs, { Dayjs } from "dayjs";
import * as React from "react";
import { ArrivalTime } from "../interfaces/interface.d";
import { Bullet } from "./Bullet";

const useStyles = makeStyles(() =>
  createStyles({
    early: {
      color: green[400],
    },
    late: {
      color: red[400],
    },
  })
);

export interface ArrivalTimeListItemProps {
  readonly arrivalTime: ArrivalTime;
  arrivalTimeOnClick(arrivalTime: ArrivalTime): void;
}

export const ArrivalTimeListItem: React.FunctionComponent<ArrivalTimeListItemProps> = ({
  arrivalTime,
  arrivalTimeOnClick,
}) => {
  const { updatedArrivalTime, scheduledArrivalTime } = arrivalTime;

  const classes = useStyles();

  const scheduledArrivalTimeInMoment: Dayjs = dayjs(
    scheduledArrivalTime,
    "HH:mm:ss"
  );

  let timeDiffString;
  let textColor: string | undefined = undefined;
  let updatedArrivalTimeInMoment: Dayjs | undefined = undefined;

  if (updatedArrivalTime) {
    // TODO: Move the calculation to the backend
    updatedArrivalTimeInMoment = dayjs(updatedArrivalTime, "HH:mm:ss");
    const early: boolean = updatedArrivalTimeInMoment.isBefore(
      scheduledArrivalTimeInMoment
    );

    const isSame: boolean = scheduledArrivalTimeInMoment.isSame(
      updatedArrivalTimeInMoment,
      "minute"
    );

    const duration: string = scheduledArrivalTimeInMoment.from(
      updatedArrivalTimeInMoment,
      true
    );
    timeDiffString = `${early ? "Early" : "Delayed"} ${duration}`;
    textColor = early ? classes.early : classes.late;
    if (isSame) {
      timeDiffString = "On time";
      textColor = classes.early;
    }
  }

  return (
    <ListItem
      button={true}
      key={scheduledArrivalTime}
      onClick={() => arrivalTimeOnClick(arrivalTime)}
    >
      <ListItemText
        primary={
          <span>
            <DirectionsBusIcon fontSize={"small"} />
            <Button
              size="small"
              variant="contained"
              disableElevation={true}
              color={"primary"}
              style={{ marginLeft: 8, marginRight: 8, marginTop: -10 }}
            >
              {arrivalTime.trip.routeId}
            </Button>
            <Typography display={"inline"} variant={"body2"}>
              {arrivalTime.trip.tripHeadsign}
            </Typography>
          </span>
        }
        secondaryTypographyProps={{
          color: "textPrimary",
        }}
        secondary={
          <React.Fragment>
            <Typography
              className={updatedArrivalTime ? textColor : undefined}
              component={"span"}
              display={"inline"}
              variant={"body2"}
            >
              {updatedArrivalTimeInMoment ? `${timeDiffString}` : "Scheduled"}
            </Typography>{" "}
            <Bullet />{" "}
            <Typography
              className={updatedArrivalTime ? textColor : undefined}
              component={"span"}
              display={"inline"}
              variant={"body2"}
            >
              {updatedArrivalTimeInMoment
                ? updatedArrivalTimeInMoment.format("h:mm A")
                : scheduledArrivalTimeInMoment.format("h:mm A")}
            </Typography>{" "}
            <Bullet />
            {arrivalTime.trip.wheelchairAccessible && (
              <AccessibleIcon fontSize={"small"} />
            )}
            {arrivalTime.trip.bikesAllowed && (
              <DirectionsBikeIcon fontSize={"small"} />
            )}
          </React.Fragment>
        }
      />
      <Typography
        className={updatedArrivalTime ? textColor : undefined}
        component={"span"}
      >
        In{" "}
        {updatedArrivalTimeInMoment
          ? updatedArrivalTimeInMoment.fromNow(true)
          : scheduledArrivalTimeInMoment.fromNow(true)}
      </Typography>
    </ListItem>
  );
};
