import { StopsAndShapesQuery } from "../../schemas/StopsAndRouteShapes.generated";
import * as React from "react";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import { Button } from "@mui/material";
import {
  TimelineOppositeContent,
  timelineOppositeContentClasses,
} from "@mui/lab";

interface StopsTimelineProps {
  stops: StopsAndShapesQuery["stopsAndShapes"]["stops"];

  setSelectedStopId(stopId: number): void;
}

export const StopsTimeline: React.FC<StopsTimelineProps> = ({
  stops,
  setSelectedStopId,
}) => {
  return (
    <Timeline
      sx={{
        [`& .${timelineOppositeContentClasses.root}`]: {
          flex: 0.2,
        },
      }}
    >
      {stops?.map((stop, index) => {
        return (
          <TimelineItem key={stop.stopCode}>
            <TimelineOppositeContent color="text.secondary">
              {stop.stopId}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={"primary"} />
              {index !== stops.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Button
                size={"small"}
                variant="outlined"
                onClick={() => {
                  setSelectedStopId(stop.stopId);
                }}
              >
                {stop.stopName}
              </Button>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
};
