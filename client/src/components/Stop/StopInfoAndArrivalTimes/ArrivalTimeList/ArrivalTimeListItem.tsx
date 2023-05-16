import { Box, ListItemButton, Typography, useTheme } from "@mui/material";
import AccessibleIcon from "@mui/icons-material/Accessible";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import dayjs, { Dayjs } from "dayjs";
import * as React from "react";
import { Bullet } from "./Bullet";
import { RouteIdDisplay } from "../../../RouteIdDisplay/RouteIdDisplay";
import { Link as RouterLink } from "react-router-dom";
import { useViewStatePathname } from "../../../../hooks/UseViewStatePathname";
import { StopQuery } from "../../../../schemas/Stop.generated";
import { ArrivalTimesQuery } from "../../../../schemas/ArrivalTimes.generated";

export interface ArrivalTimeListItemProps {
  arrivalTime: ArrivalTimesQuery["arrivalTimes"][number];
  stop: StopQuery["stop"];
}

export const ArrivalTimeListItem: React.FunctionComponent<ArrivalTimeListItemProps> = ({
  arrivalTime,
  stop,
}) => {
  const { viewStatePathname } = useViewStatePathname();

  const scheduledArrivalTime: Dayjs = dayjs(
    arrivalTime.scheduledArrivalTime,
    "HH:mm:ss"
  );
  let updatedArrivalTime;
  if (arrivalTime.updatedArrivalTime) {
    updatedArrivalTime = dayjs(arrivalTime.updatedArrivalTime, "HH:mm:ss");
  }

  const theme = useTheme();
  let timeDiffString = "Scheduled";
  let textColor = "gray";

  if (updatedArrivalTime) {
    const early = updatedArrivalTime.isBefore(scheduledArrivalTime);

    const isSame = scheduledArrivalTime.isSame(updatedArrivalTime, "minute");

    const duration = scheduledArrivalTime.from(updatedArrivalTime, true);
    timeDiffString = `${early ? "Early" : "Delayed"} ${duration}`;
    if (early) {
      textColor = "#f57c00";
    } else {
      textColor = theme.palette.error.light;
    }

    if (isSame) {
      timeDiffString = "On time";
      textColor = theme.palette.success.light;
    }
  }

  const timeDiff = scheduledArrivalTime.diff(dayjs(), "minute");
  const tripName = arrivalTime.trip.tripHeadsign?.split("-")[
    arrivalTime.trip.tripHeadsign?.split("-").length - 1
  ];
  return (
    <ListItemButton
      key={arrivalTime.scheduledArrivalTime}
      component={RouterLink}
      to={`${viewStatePathname}/stop/${stop.stopId}/trip/${arrivalTime.trip.tripId}?routeId=${arrivalTime.trip.routeId}&directionId=${arrivalTime.trip.directionId}`}
      sx={{ py: 1.5 }}
    >
      <Box display={"flex"} justifyContent={"space-between"} width={"100%"}>
        <Box display={"flex"} flexDirection={"column"} gap={1}>
          <Box display={"flex"} gap={1} alignItems={"center"}>
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
              color={textColor}
              component={"span"}
              display={"inline"}
              variant={"body2"}
              fontWeight={updatedArrivalTime ? 600 : undefined}
            >
              {timeDiffString}
            </Typography>
            <Bullet />
            <Typography
              component={"span"}
              display={"inline"}
              variant={"body2"}
              sx={{
                textDecoration:
                  timeDiff < 60 ||
                  (updatedArrivalTime && timeDiffString !== "On time")
                    ? "line-through"
                    : undefined,
              }}
            >
              {timeDiff < 60 ||
              (updatedArrivalTime && timeDiffString !== "On time") ? (
                <>
                  {updatedArrivalTime
                    ? updatedArrivalTime.format("h:mm A")
                    : scheduledArrivalTime.format("h:mm A")}
                </>
              ) : null}
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
                {scheduledArrivalTime.format("h:mm")}
              </Typography>
              <Typography color={"gray"} fontSize={14}>
                {scheduledArrivalTime.format("A")}
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
