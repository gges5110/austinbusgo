import {
  Button,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import AccessibleIcon from "@mui/icons-material/Accessible";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import dayjs, { Dayjs } from "dayjs";
import * as React from "react";
import { ArrivalTime } from "../../../interfaces/interface.d";
import { Bullet } from "./Bullet";

export interface ArrivalTimeListItemProps {
  readonly arrivalTime: ArrivalTime;
  arrivalTimeOnClick(arrivalTime: ArrivalTime): void;
}

export const ArrivalTimeListItem: React.FunctionComponent<ArrivalTimeListItemProps> = ({
  arrivalTime,
  arrivalTimeOnClick,
}) => {
  const { updatedArrivalTime, scheduledArrivalTime } = arrivalTime;

  const scheduledArrivalTimeInMoment: Dayjs = dayjs(
    scheduledArrivalTime,
    "HH:mm:ss"
  );

  let timeDiffString;
  const textColor: string | undefined = undefined;
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

    if (isSame) {
      timeDiffString = "On time";
    }
  }

  return (
    <ListItemButton
      key={scheduledArrivalTime}
      onClick={() => {
        arrivalTimeOnClick(arrivalTime);
      }}
    >
      <ListItemText
        style={{ marginRight: 30 }}
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
        {updatedArrivalTimeInMoment
          ? updatedArrivalTimeInMoment.fromNow()
          : scheduledArrivalTimeInMoment.fromNow()}
      </Typography>
    </ListItemButton>
  );
};
