import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import { useSetAtom } from "jotai";
import * as React from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useEarliestArrivalTimesOnRouteQuery } from "shared/api/schemas/EarliestArrivalTimesOnRoute.generated";
import { StopsAndShapesQuery } from "shared/api/schemas/StopsAndRouteShapes.generated";
import { useVehiclePositionsQuery } from "shared/api/schemas/VehiclePositions.generated";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import {
  hoveringStopAtom,
  hoveringVehiclePositionAtom,
  mapsFlyToCoordinateAtom,
} from "shared/state/atoms";
import { Route, Stop, VehicleStopStatus } from "shared/types/interface.d";
import { getDate, getTime } from "shared/utils/dateUtils";

interface StopsTimelineProps {
  route: Route;
  stops: StopsAndShapesQuery["stopsAndShapes"]["stops"];
}

export const RouteStopsTimeline: React.FC<StopsTimelineProps> = ({
  route,
  stops,
}) => {
  const { directionId } = useParams();
  const { viewStatePathname, withPreservedSearch } = useViewStatePathname();
  const setHoveringStop = useSetAtom(hoveringStopAtom);
  const setHoveringVehiclePosition = useSetAtom(hoveringVehiclePositionAtom);
  const setMapsFlyToCoordinate = useSetAtom(mapsFlyToCoordinateAtom);
  const { data: vehiclePositionsData } = useVehiclePositionsQuery(
    {
      routeId: route.routeId,
      direction: Number(directionId),
    },
    {
      refetchInterval: 15000,
    }
  );
  const { data } = useEarliestArrivalTimesOnRouteQuery(
    {
      routeId: route.routeId,
      directionId: Number(directionId),
      date: getDate(),
      time: getTime(),
    },
    { keepPreviousData: true }
  );
  const theme = useTheme();
  const vehiclePositions = vehiclePositionsData?.vehiclePositions || [];
  return (
    <Box component={"div"}>
      <List>
        {stops?.map((stop, index) => {
          let updatedArrivalTime, scheduledArrivalTime;
          const arrivalTime = data?.earliestArrivalTimesOnRoute.find(
            (t) => t.stopId === stop.stopId
          );
          if (arrivalTime) {
            const scheduledArrivalTimeString = arrivalTime.scheduledArrivalTime;
            const updatedArrivalTimeString = arrivalTime.updatedArrivalTime;

            scheduledArrivalTime = dayjs(
              scheduledArrivalTimeString,
              "HH:mm:ss"
            );
            if (updatedArrivalTimeString) {
              updatedArrivalTime = dayjs(updatedArrivalTimeString, "HH:mm:ss");
            }
          }

          const at = updatedArrivalTime || scheduledArrivalTime;
          const timeDiff = at?.diff(dayjs(), "minute");

          const vehiclePosition = vehiclePositions.find(
            (vehiclePosition) => vehiclePosition.stopId === stop.stopId
          );
          return (
            <Box
              className={"selected"}
              component={"div"}
              key={stop.stopId}
              sx={{
                position: "relative",
                [`&.selected::before`]: {
                  content: "''",
                  width: "18px",
                  backgroundColor: `#${route.routeColor}`,
                  position: "absolute",
                  top: "calc(50% - 10px)",
                  bottom: 0,
                  left: 10,
                  borderTopLeftRadius: "20px 20px",
                  borderTopRightRadius: "20px 20px",
                },
                [`&::after`]: {
                  content: "''",
                  width: "8px",
                  height: "8px",
                  backgroundColor: `#FFF`,
                  position: "absolute",
                  top: "calc(50% - 5px)",
                  left: 10 + 5,
                  borderRadius: "50%",
                  opacity: "60%",
                },
                [`&.selected::after`]: {
                  content: "''",
                  width: "12px",
                  height: "12px",
                  backgroundColor: `#FFF`,
                  position: "absolute",
                  top: "calc(50% - 5px)",
                  left: 10 + 3,
                  borderRadius: "50%",
                  opacity: "100%",
                },
              }}
            >
              {vehiclePosition && (
                <Paper
                  sx={{
                    position: "absolute",
                    top:
                      vehiclePosition.currentStatus ===
                      VehicleStopStatus.InTransitTo
                        ? "-25%"
                        : "25%",
                    zIndex: 1,
                    borderRadius: "50%",
                  }}
                >
                  <IconButton
                    onClick={() => {
                      if (
                        vehiclePosition.position?.latitude &&
                        vehiclePosition.position?.longitude
                      ) {
                        setMapsFlyToCoordinate([
                          vehiclePosition.position?.longitude,
                          vehiclePosition.position?.latitude,
                        ]);
                      }
                    }}
                    onMouseEnter={() => {
                      setHoveringVehiclePosition(vehiclePosition);
                    }}
                    onMouseLeave={() => {
                      setHoveringVehiclePosition(undefined);
                    }}
                  >
                    <DirectionsBusIcon />
                  </IconButton>
                </Paper>
              )}
              <ListItemButton
                component={RouterLink}
                key={stop.stopId}
                onMouseEnter={() => {
                  setHoveringStop(stop as Stop);
                }}
                onMouseLeave={() => {
                  setHoveringStop(undefined);
                }}
                sx={{
                  pl: 6,
                  py: 2.5,
                }}
                to={`/stop/${stop.stopId}${viewStatePathname}${withPreservedSearch({ routeId: route.routeId, directionId })}`}
              >
                <Box
                  display={"flex"}
                  justifyContent={"space-between"}
                  width={"100%"}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      height: "100%",
                      width: "100%",
                    }}
                  >
                    <Box display={"flex"} flexDirection={"column"}>
                      <Typography fontWeight={600}>{stop.stopName}</Typography>
                      {at && (
                        <Typography
                          color={
                            updatedArrivalTime
                              ? theme.palette.success.light
                              : theme.palette.grey["500"]
                          }
                          fontSize={14}
                          fontWeight={updatedArrivalTime ? 600 : undefined}
                        >
                          {updatedArrivalTime ? "Live" : "Scheduled"}
                        </Typography>
                      )}
                    </Box>

                    {timeDiff !== undefined && at && (
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
                              {at.format("h:mm")}
                            </Typography>
                            <Typography color={"gray"} fontSize={14}>
                              {at.format("A")}
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
                    )}
                  </Box>
                </Box>
              </ListItemButton>
              <Divider
                className={
                  index === 0
                    ? "first"
                    : index === stops?.length - 1
                      ? "last"
                      : undefined
                }
                sx={{
                  ml: 6,
                  [`&::before`]: {
                    content: "''",
                    width: "18px",
                    backgroundColor: `#${route.routeColor}`,
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 10,
                  },
                  [`&.first::before`]: {
                    content: "''",
                    width: "18px",
                    backgroundColor: `#${route.routeColor}`,
                    position: "absolute",
                    top: "calc(50% - 10px)",
                    bottom: 0,
                    left: 10,
                    borderTopLeftRadius: "20px 20px",
                    borderTopRightRadius: "20px 20px",
                  },
                  [`&.last::before`]: {
                    content: "''",
                    width: "18px",
                    backgroundColor: `#${route.routeColor}`,
                    position: "absolute",
                    top: 0,
                    bottom: "calc(50% - 10px)",
                    left: 10,
                    borderBottomLeftRadius: "20px 20px",
                    borderBottomRightRadius: "20px 20px",
                  },
                }}
              />
            </Box>
          );
        })}
      </List>
    </Box>
  );
};
