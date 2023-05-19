import { StopsAndShapesQuery } from "../../../schemas/StopsAndRouteShapes.generated";
import * as React from "react";
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

import { Link as RouterLink, useParams } from "react-router-dom";
import { useViewStatePathname } from "../../../hooks/UseViewStatePathname";
import { useSetAtom } from "jotai";
import {
  hoveringStopAtom,
  hoveringVehiclePositionAtom,
  mapsFlyToCoordinateAtom,
} from "../../../Atoms";
import dayjs from "dayjs";
import {
  Route,
  Stop,
  VehiclePosition,
  VehicleStopStatus,
} from "../../../interfaces/interface.d";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { useEarliestArrivalTimesOnRouteQuery } from "../../../schemas/EarliestArrivalTimesOnRoute.generated";
import { getDate, getTime } from "../../../dateUtils";

interface StopsTimelineProps {
  route: Route;
  stops: StopsAndShapesQuery["stopsAndShapes"]["stops"];
  vehiclePositions: VehiclePosition[];
}

export const RouteStopsTimeline: React.FC<StopsTimelineProps> = ({
  route,
  stops,
  vehiclePositions,
}) => {
  const { routeId, directionId } = useParams();
  const { viewStatePathname } = useViewStatePathname();
  const setHoveringStop = useSetAtom(hoveringStopAtom);
  const setHoveringVehiclePosition = useSetAtom(hoveringVehiclePositionAtom);
  const setMapsFlyToCoordinate = useSetAtom(mapsFlyToCoordinateAtom);
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

          let timeDiffString = "Scheduled";
          let textColor = "gray";

          if (updatedArrivalTime && scheduledArrivalTime) {
            const early = updatedArrivalTime.isBefore(scheduledArrivalTime);

            const isSame = scheduledArrivalTime.isBetween(
              updatedArrivalTime.subtract(2, "minute"),
              updatedArrivalTime.add(2, "minute"),
              "minute"
            );

            const duration = scheduledArrivalTime.from(
              updatedArrivalTime,
              true
            );
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
                  // opacity: stop.stopSequence < 6 ? "50%" : "100%",
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
                        ? "75%"
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
                to={`${viewStatePathname}/stop/${stop.stopId}?routeId=${routeId}&directionId=${directionId}`}
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
                      <Typography
                        color={textColor}
                        fontSize={14}
                        fontWeight={updatedArrivalTime ? 600 : undefined}
                      >
                        {timeDiffString}
                      </Typography>
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
                    // opacity:
                    //   stop.stopSequence <= selectedStopSequence
                    //     ? "50%"
                    //     : "100%",
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
                    // opacity:
                    //   stop.stopSequence < selectedStopSequence ? "50%" : "100%",
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
                    // opacity:
                    //   stop.stopSequence < selectedStopSequence ? "50%" : "100%",
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
