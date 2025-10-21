import * as React from "react";
import dayjs from "dayjs";
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
import { StopTimesQuery } from "../../../../../shared/api/schemas/StopTimes.generated";
import { useEffect, useRef } from "react";
import { TripQuery } from "../../../../../shared/api/schemas/Trip.generated";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useViewStatePathname } from "../../../../../shared/hooks/UseViewStatePathname";
import {
  VehiclePosition,
  VehicleStopStatus,
} from "../../../../../shared/types/interface.d";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { StopQuery } from "../../../../../shared/api/schemas/Stop.generated";
import { useUpdateViewState } from "../../../../map/hooks/Map/UseViewStateSync";
import { TripUpdateQuery } from "../../../../../shared/api/schemas/TripUpdate.generated";
import { useSetAtom } from "jotai";
import {
  hoveringVehiclePositionAtom,
  mapsFlyToCoordinateAtom,
} from "../../../../../shared/state/atoms";

interface TripTimelineProps {
  stopTimes: StopTimesQuery["stopTimes"];
  stop?: StopQuery["stop"];
  trip: TripQuery["trip"];
  vehiclePosition: VehiclePosition | undefined;
  tripUpdate: TripUpdateQuery["tripUpdate"];
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
}

export const TripTimeline: React.FC<TripTimelineProps> = ({
  stopTimes,
  stop,
  trip,
  containerRef,
  vehiclePosition,
  tripUpdate,
}) => {
  const { viewStatePathname } = useViewStatePathname();
  const setHoveringVehiclePosition = useSetAtom(hoveringVehiclePositionAtom);
  const setMapsFlyToCoordinate = useSetAtom(mapsFlyToCoordinateAtom);
  const [searchParams] = useSearchParams();
  const stopTimelineItemRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    setTimeout(() => {
      if (stopTimelineItemRef.current && containerRef.current) {
        containerRef.current.scrollTo({
          top:
            stopTimelineItemRef.current?.offsetTop -
            containerRef.current.offsetTop -
            stopTimelineItemRef.current?.scrollHeight / 2,
          behavior: "smooth",
        });
      }
    }, 200);
  }, [containerRef, stopTimelineItemRef]);
  const { getViewStateURL } = useUpdateViewState();

  const selectedStopSequence =
    stopTimes?.find((stopTime) => stopTime.stopId === stop?.stopId)
      ?.stopSequence || 0;
  const vehicleStopId = vehiclePosition?.stopId;
  const vehicleStopSequence = vehiclePosition?.currentStopSequence || 0;
  const theme = useTheme();
  // TODO: fix timeline rail styling of border radius
  return (
    <Box component={"div"}>
      <List>
        {stopTimes?.map((stopTime, index) => {
          const stopTimeUpdateIndex = tripUpdate?.stopTimeUpdate.findIndex(
            (stopTimeUpdate) =>
              stopTimeUpdate?.stopSequence === stopTime.stopSequence
          );
          const scheduledArrivalTime = dayjs(stopTime.arrivalTime, "HH:mm:ss");
          let updatedArrivalTime;
          if (stopTimeUpdateIndex !== undefined && stopTimeUpdateIndex !== -1) {
            const time =
              tripUpdate?.stopTimeUpdate[stopTimeUpdateIndex]?.arrival?.time;
            if (time) {
              updatedArrivalTime = dayjs.unix(time);
            }
          }

          const isSelectedStop = stopTime.stopId === stop?.stopId;
          const isPastStop = vehicleStopSequence > stopTime.stopSequence;

          let timeDiffString = "Scheduled";
          let textColor = "gray";

          if (updatedArrivalTime) {
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

          return (
            <Box
              className={isSelectedStop ? "selected" : undefined}
              component={"div"}
              key={stopTime.stopId}
              ref={isSelectedStop ? stopTimelineItemRef : undefined}
              sx={{
                position: "relative",
                [`&.selected::before`]: {
                  content: "''",
                  width: "18px",
                  backgroundColor: `#${trip?.route.routeColor}`,
                  position: "absolute",
                  top: "calc(50% - 10px)",
                  bottom: 0,
                  left: 10,
                  borderTopLeftRadius: "20px 20px",
                  borderTopRightRadius: "20px 20px",
                  opacity:
                    stopTime.stopSequence < selectedStopSequence
                      ? "50%"
                      : "100%",
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
              {vehicleStopId === stopTime.stopId && (
                <Paper
                  sx={{
                    position: "absolute",
                    top:
                      vehiclePosition?.currentStatus ===
                      VehicleStopStatus.InTransitTo
                        ? "-25%"
                        : "25%",
                    zIndex: 1,
                    borderRadius: "50%",
                  }}
                >
                  <IconButton
                    component={RouterLink}
                    onClick={() => {
                      if (
                        vehiclePosition?.position?.latitude &&
                        vehiclePosition?.position?.longitude
                      ) {
                        setMapsFlyToCoordinate([
                          vehiclePosition?.position?.longitude,
                          vehiclePosition?.position?.latitude,
                        ]);
                      }
                    }}
                    onMouseEnter={() => {
                      setHoveringVehiclePosition(vehiclePosition);
                    }}
                    onMouseLeave={() => {
                      setHoveringVehiclePosition(undefined);
                    }}
                    to={getViewStateURL({
                      latitude: vehiclePosition?.position?.latitude,
                      longitude: vehiclePosition?.position?.longitude,
                    })}
                  >
                    <DirectionsBusIcon />
                  </IconButton>
                </Paper>
              )}
              <ListItemButton
                component={RouterLink}
                key={stopTime.stopId}
                sx={{
                  pl: 6,
                  py: 2.5,
                  color: isPastStop ? "gray" : "unset",
                }}
                to={
                  searchParams.get("routeId")
                    ? `${viewStatePathname}/stop/${
                        stopTime.stopId
                      }?routeId=${searchParams.get(
                        "routeId"
                      )}&directionId=${searchParams.get("directionId")}`
                    : `${viewStatePathname}/stop/${stopTime.stopId}`
                }
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
                        {stopTime.stop.stopName}
                      </Typography>
                      <Typography
                        color={textColor}
                        fontSize={14}
                        fontWeight={updatedArrivalTime ? 600 : undefined}
                      >
                        {timeDiffString}
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
                          {scheduledArrivalTime.format("h:mm")}
                        </Typography>
                        <Typography color={"gray"} fontSize={14}>
                          {scheduledArrivalTime.format("A")}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        {updatedArrivalTime !== undefined ? (
                          <Typography whiteSpace={"nowrap"}>
                            {updatedArrivalTime.format("LT")}
                          </Typography>
                        ) : (
                          <Typography whiteSpace={"nowrap"}>
                            {scheduledArrivalTime.format("LT")}
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                </Box>
              </ListItemButton>
              <Divider
                className={
                  index === 0
                    ? "first"
                    : index === stopTimes?.length - 1
                    ? "last"
                    : undefined
                }
                sx={{
                  ml: 6,
                  [`&::before`]: {
                    content: "''",
                    width: "18px",
                    backgroundColor: `#${trip?.route.routeColor}`,
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 10,
                    opacity:
                      stopTime.stopSequence <= selectedStopSequence
                        ? "50%"
                        : "100%",
                  },
                  [`&.first::before`]: {
                    content: "''",
                    width: "18px",
                    backgroundColor: `#${trip?.route.routeColor}`,
                    position: "absolute",
                    top: "calc(50% - 10px)",
                    bottom: 0,
                    left: 10,
                    borderTopLeftRadius: "20px 20px",
                    borderTopRightRadius: "20px 20px",
                    opacity:
                      stopTime.stopSequence < selectedStopSequence
                        ? "50%"
                        : "100%",
                  },
                  [`&.last::before`]: {
                    content: "''",
                    width: "18px",
                    backgroundColor: `#${trip?.route.routeColor}`,
                    position: "absolute",
                    top: 0,
                    bottom: "calc(50% - 10px)",
                    left: 10,
                    borderBottomLeftRadius: "20px 20px",
                    borderBottomRightRadius: "20px 20px",
                    opacity:
                      stopTime.stopSequence < selectedStopSequence
                        ? "50%"
                        : "100%",
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
