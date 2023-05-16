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
import { hoveringStopAtom } from "../../../Atoms";
import dayjs from "dayjs";
import { Route, Stop, VehiclePosition } from "../../../interfaces/interface.d";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";

interface StopsTimelineProps {
  route: Route;
  stops: StopsAndShapesQuery["stopsAndShapes"]["stops"];
  vehiclePositions: VehiclePosition[];
}

export const StopsTimeline: React.FC<StopsTimelineProps> = ({
  route,
  stops,
  vehiclePositions,
}) => {
  const theme = useTheme();
  const { routeId, directionId } = useParams();
  const { viewStatePathname } = useViewStatePathname();
  const setHoveringStop = useSetAtom(hoveringStopAtom);
  console.log(vehiclePositions);
  return (
    <Box component={"div"}>
      <List>
        {stops?.map((stop, index) => {
          const arrivalTime = dayjs(dayjs(), "HH:mm:ss");
          const isSelectedStop = stop.stopId === stop?.stopId;

          return (
            <Box
              key={stop.stopId}
              component={"div"}
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
              className={isSelectedStop ? "selected" : undefined}
            >
              {vehiclePositions.findIndex(
                (vehiclePosition) => vehiclePosition.stopId === stop.stopId
              ) !== -1 && (
                <Paper
                  sx={{
                    position: "absolute",
                    top: "65px",
                    zIndex: 1,
                    borderRadius: "50%",
                  }}
                >
                  <IconButton>
                    <DirectionsBusIcon />
                  </IconButton>
                </Paper>
              )}
              <ListItemButton
                key={stop.stopId}
                component={RouterLink}
                to={`${viewStatePathname}/stop/${stop.stopId}?routeId=${routeId}&directionId=${directionId}`}
                sx={{
                  pl: 6,
                  py: 2.5,
                }}
                onMouseEnter={() => {
                  setHoveringStop(stop as Stop);
                }}
                onMouseLeave={() => {
                  setHoveringStop(undefined);
                }}
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
                      <Typography fontWeight={isSelectedStop ? 600 : 400}>
                        {stop.stopName}
                      </Typography>
                      <Typography color={"gray"} fontSize={14}>
                        Scheduled
                      </Typography>
                    </Box>

                    {isSelectedStop ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-end",
                          flexDirection: "column",
                        }}
                      >
                        <Typography fontSize={24} lineHeight={1}>
                          {arrivalTime.format("h:mm")}
                        </Typography>
                        <Typography color={"gray"} fontSize={14}>
                          {arrivalTime.format("A")}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography whiteSpace={"nowrap"}>
                        {arrivalTime.format("LT")}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </ListItemButton>
              <Divider
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
                className={
                  index === 0
                    ? "first"
                    : index === stops?.length - 1
                    ? "last"
                    : undefined
                }
              />
            </Box>
          );
        })}
      </List>
    </Box>
  );
};
