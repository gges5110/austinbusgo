import * as React from "react";
import Timeline from "@mui/lab/Timeline";
import { timelineItemClasses } from "@mui/lab";
import dayjs from "dayjs";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineContent from "@mui/lab/TimelineContent";
import { Box, Typography } from "@mui/material";
import { StopTimesQuery } from "../../schemas/StopTimes.generated";
import { useEffect, useRef } from "react";
import { StopQuery } from "../../schemas/Stop.generated";
import { TripQuery } from "../../schemas/Trip.generated";

interface TripTimelineProps {
  stopTimes: StopTimesQuery["stopTimes"];
  stop?: StopQuery["stop"];
  trip: TripQuery["trip"];
}

export const TripTimeline: React.FC<TripTimelineProps> = ({
  stopTimes,
  stop,
  trip,
}) => {
  const stopTimelineItemRef = useRef<HTMLLIElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  const selectedStopSequence =
    stopTimes?.find((stopTime) => stopTime.stopId === stop?.stopId)
      ?.stopSequence || 0;

  // TODO: fix timeline rail styling of border radius
  return (
    <Box
      sx={{
        overflowY: "auto",
        maxHeight: "80vh",
      }}
      component={"div"}
      ref={containerRef}
    >
      <Timeline
        sx={{
          [`& .${timelineItemClasses.root}:before`]: {
            flex: 0,
            padding: 0,
          },
          paddingRight: 0,
        }}
      >
        {stopTimes?.map((stopTime) => {
          const arrivalTime = dayjs(stopTime.arrivalTime, "HH:mm:ss");
          const isSelectedStop = stopTime.stopId === stop?.stopId;

          return (
            <TimelineItem
              key={stopTime.stopId}
              ref={isSelectedStop ? stopTimelineItemRef : undefined}
            >
              <TimelineSeparator
                sx={{
                  backgroundColor: `#${trip?.route.routeColor}`,
                  opacity:
                    stopTime.stopSequence < selectedStopSequence
                      ? "50%"
                      : "unset",
                  minWidth: "20px",
                }}
              >
                <TimelineDot
                  sx={{
                    backgroundColor: "white",
                    m: "auto",
                    p: isSelectedStop ? "4px" : "2px",
                  }}
                />
              </TimelineSeparator>
              <TimelineContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography fontWeight={isSelectedStop ? 500 : 400}>
                    {stopTime.stop.stopName}
                  </Typography>
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
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </Box>
  );
};
