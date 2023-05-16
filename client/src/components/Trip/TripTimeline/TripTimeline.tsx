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
} from "@mui/material";
import { StopTimesQuery } from "../../../schemas/StopTimes.generated";
import { useEffect, useRef } from "react";
import { TripQuery } from "../../../schemas/Trip.generated";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { useViewStatePathname } from "../../../hooks/UseViewStatePathname";
import { VehiclePosition } from "../../../interfaces/interface.d";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { StopQuery } from "../../../schemas/Stop.generated";
import { useUpdateViewState } from "../../../hooks/Map/UseViewStateSync";

interface TripTimelineProps {
  stopTimes: StopTimesQuery["stopTimes"];
  stop?: StopQuery["stop"];
  trip: TripQuery["trip"];
  vehiclePosition: VehiclePosition | undefined;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
}

export const TripTimeline: React.FC<TripTimelineProps> = ({
  stopTimes,
  stop,
  trip,
  containerRef,
  vehiclePosition,
}) => {
  const { viewStatePathname } = useViewStatePathname();
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
  // TODO: fix timeline rail styling of border radius
  return (
    <Box component={"div"}>
      <List>
        {stopTimes?.map((stopTime, index) => {
          const arrivalTime = dayjs(stopTime.arrivalTime, "HH:mm:ss");
          const isSelectedStop = stopTime.stopId === stop?.stopId;

          return (
            <Box
              key={stopTime.stopId}
              component={"div"}
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
              className={isSelectedStop ? "selected" : undefined}
            >
              {vehicleStopId === stopTime.stopId && (
                <Paper
                  sx={{
                    position: "absolute",
                    top: "65px",
                    zIndex: 1,
                    borderRadius: "50%",
                  }}
                >
                  <IconButton
                    component={RouterLink}
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
                key={stopTime.stopId}
                component={RouterLink}
                to={
                  searchParams.get("routeId")
                    ? `${viewStatePathname}/stop/${
                        stopTime.stopId
                      }?routeId=${searchParams.get(
                        "routeId"
                      )}&directionId=${searchParams.get("directionId")}`
                    : `${viewStatePathname}/stop/${stopTime.stopId}`
                }
                sx={{
                  pl: 6,
                  py: 2.5,
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
                        {stopTime.stop.stopName}
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
                className={
                  index === 0
                    ? "first"
                    : index === stopTimes?.length - 1
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
