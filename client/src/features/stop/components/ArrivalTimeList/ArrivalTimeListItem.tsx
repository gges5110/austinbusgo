import AccessibleIcon from "@mui/icons-material/Accessible";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { Box, ListItemButton, Typography, useTheme } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import { ArrivalTimesQuery } from "shared/api/schemas/ArrivalTimes.generated";
import { StopQuery } from "shared/api/schemas/Stop.generated";
import { RouteIdDisplay } from "shared/components/RouteIdDisplay/RouteIdDisplay";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { parseArrivalTime } from "shared/utils/dateUtils";

import { Bullet } from "./Bullet";

export interface ArrivalTimeListItemProps {
  arrivalTime: ArrivalTimesQuery["arrivalTimes"][number];
  stop: StopQuery["stop"];
}

export const ArrivalTimeListItem: React.FunctionComponent<
  ArrivalTimeListItemProps
> = ({ arrivalTime, stop }) => {
  const { viewStatePathname, withPreservedSearch } = useViewStatePathname();

  const scheduledArrivalTime: Dayjs = parseArrivalTime(
    arrivalTime.scheduledArrivalTime
  );
  let updatedArrivalTime;
  if (arrivalTime.updatedArrivalTime) {
    updatedArrivalTime = parseArrivalTime(arrivalTime.updatedArrivalTime);
  }

  const theme = useTheme();
  let timeDiffString = "Scheduled";
  let textColor = "gray";

  if (updatedArrivalTime) {
    const early = updatedArrivalTime.isBefore(scheduledArrivalTime);

    const isSame = scheduledArrivalTime.isBetween(
      updatedArrivalTime.subtract(2, "minute"),
      updatedArrivalTime.add(2, "minute"),
      "minute"
    );

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
  const tripName =
    arrivalTime.trip.tripHeadsign?.split("-")[
      arrivalTime.trip.tripHeadsign?.split("-").length - 1
    ];
  return (
    <ListItemButton
      component={RouterLink}
      key={arrivalTime.scheduledArrivalTime}
      sx={{ py: 1.5 }}
      to={`/stop/${stop.stopId}/trip/${arrivalTime.trip.tripId}${viewStatePathname}${withPreservedSearch({ routeId: arrivalTime.trip.routeId, directionId: String(arrivalTime.trip.directionId) })}`}
    >
      <Box display={"flex"} justifyContent={"space-between"} width={"100%"}>
        <Box display={"flex"} flexDirection={"column"} gap={1}>
          <Box alignItems={"center"} display={"flex"} gap={1}>
            <DirectionsBusIcon fontSize={"small"} />
            <RouteIdDisplay
              routeColor={arrivalTime.trip.route.routeColor}
              routeId={arrivalTime.trip.routeId}
            />
            <Typography display={"inline"} variant={"body2"}>
              {tripName}
            </Typography>
          </Box>
          <Box alignItems={"center"} color={"gray"} display={"flex"}>
            <Typography
              color={textColor}
              component={"span"}
              display={"inline"}
              fontWeight={updatedArrivalTime ? 600 : undefined}
              variant={"body2"}
            >
              {timeDiffString}
            </Typography>
            <Bullet />
            <Typography
              component={"span"}
              display={"inline"}
              sx={{
                textDecoration:
                  updatedArrivalTime && timeDiffString !== "On time"
                    ? "line-through"
                    : undefined,
              }}
              variant={"body2"}
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
          ) : timeDiff == 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Typography fontSize={20}>Now</Typography>
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
