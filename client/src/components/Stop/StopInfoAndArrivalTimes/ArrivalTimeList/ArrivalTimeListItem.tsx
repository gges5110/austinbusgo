import { Box, ListItemButton, Typography } from "@mui/material";
import AccessibleIcon from "@mui/icons-material/Accessible";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import dayjs, { Dayjs } from "dayjs";
import * as React from "react";
import { Bullet } from "./Bullet";
import * as Types from "../../../../interfaces/interface.d";
import { RouteIdDisplay } from "../../../RouteIdDisplay/RouteIdDisplay";

type ArrivalTime = { __typename?: "ArrivalTime" } & Pick<
  Types.ArrivalTime,
  "updatedArrivalTime" | "scheduledArrivalTime"
> & {
    trip: { __typename?: "TripWithRoute" } & Pick<
      Types.TripWithRoute,
      | "routeId"
      | "serviceId"
      | "tripId"
      | "tripHeadsign"
      | "tripShortName"
      | "directionId"
      | "blockId"
      | "shapeId"
      | "wheelchairAccessible"
      | "bikesAllowed"
    > & {
        route: { __typename?: "Route" } & Pick<
          Types.Route,
          "routeColor" | "routeLongName"
        >;
      };
    vehicle?: Types.Maybe<
      { __typename?: "VehiclePosition" } & Pick<
        Types.VehiclePosition,
        "stopId" | "currentStatus" | "timestamp"
      > & {
          trip?: Types.Maybe<
            { __typename?: "TripDescriptor" } & Pick<
              Types.TripDescriptor,
              "tripId" | "routeId" | "startDate"
            >
          >;
          vehicle?: Types.Maybe<
            { __typename?: "VehicleDescriptor" } & Pick<
              Types.VehicleDescriptor,
              "id" | "label"
            >
          >;
          position?: Types.Maybe<
            { __typename?: "Position" } & Pick<
              Types.Position,
              "latitude" | "longitude"
            >
          >;
        }
    >;
  };

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

  const timeDiff = scheduledArrivalTimeInMoment.diff(dayjs(), "minute");
  const tripName = arrivalTime.trip.tripHeadsign?.split("-")[
    arrivalTime.trip.tripHeadsign?.split("-").length - 1
  ];
  return (
    <ListItemButton
      key={scheduledArrivalTime}
      onClick={() => {
        arrivalTimeOnClick(arrivalTime);
      }}
      sx={{ py: 1.5 }}
    >
      <Box display={"flex"} justifyContent={"space-between"} width={"100%"}>
        <Box display={"flex"} flexDirection={"column"} gap={1}>
          <Box display={"flex"} gap={1}>
            <DirectionsBusIcon fontSize={"small"} />
            <RouteIdDisplay
              routeColor={arrivalTime.trip.route.routeColor}
              routeId={arrivalTime.trip.routeId}
            />
            <Typography display={"inline"} variant={"body2"}>
              {tripName}
            </Typography>
          </Box>
          <Box color={"gray"} display={"flex"} alignItems={"center"}>
            <Typography
              className={updatedArrivalTime ? textColor : undefined}
              component={"span"}
              display={"inline"}
              variant={"body2"}
            >
              {updatedArrivalTimeInMoment ? `${timeDiffString}` : "Scheduled"}
            </Typography>
            <Bullet />
            <Typography
              className={updatedArrivalTime ? textColor : undefined}
              component={"span"}
              display={"inline"}
              variant={"body2"}
            >
              {updatedArrivalTimeInMoment
                ? updatedArrivalTimeInMoment.format("h:mm A")
                : scheduledArrivalTimeInMoment.format("h:mm A")}
            </Typography>
            {arrivalTime.trip.wheelchairAccessible && (
              <AccessibleIcon sx={{ fontSize: 16 }} />
            )}
            {arrivalTime.trip.bikesAllowed && (
              <DirectionsBikeIcon sx={{ fontSize: 16 }} />
            )}
          </Box>
        </Box>

        <Typography component={"span"}>
          {timeDiff < 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                flexDirection: "column",
                color: "gray",
              }}
            >
              <Typography fontSize={24} lineHeight={1}>
                {Math.abs(timeDiff)}
              </Typography>
              <Typography color={"gray"} fontSize={14}>
                min ago
              </Typography>
            </Box>
          ) : timeDiff >= 60 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                flexDirection: "column",
              }}
            >
              <Typography fontSize={24} lineHeight={1}>
                {scheduledArrivalTimeInMoment.format("h:mm")}
              </Typography>
              <Typography color={"gray"} fontSize={14}>
                {scheduledArrivalTimeInMoment.format("A")}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                flexDirection: "column",
              }}
            >
              <Typography fontSize={24} lineHeight={1}>
                {timeDiff}
              </Typography>
              <Typography color={"gray"} fontSize={14}>
                min
              </Typography>
            </Box>
          )}
        </Typography>
      </Box>
    </ListItemButton>
  );
};
