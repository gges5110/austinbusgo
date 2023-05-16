import { StopsAndShapesQuery } from "../../../schemas/StopsAndRouteShapes.generated";
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
import { Link as RouterLink, useParams } from "react-router-dom";
import { useViewStatePathname } from "../../../hooks/UseViewStatePathname";
import { useSetAtom } from "jotai";
import { hoveringStopAtom } from "../../../Atoms";
import { Stop } from "../../../interfaces/interface.d";

interface StopsTimelineProps {
  stops: StopsAndShapesQuery["stopsAndShapes"]["stops"];
}

export const StopsTimeline: React.FC<StopsTimelineProps> = ({ stops }) => {
  const { routeId, directionId } = useParams();
  const { viewStatePathname } = useViewStatePathname();
  const setHoveringStop = useSetAtom(hoveringStopAtom);
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
                onMouseEnter={() => {
                  setHoveringStop(stop as Stop);
                }}
                onMouseLeave={() => {
                  setHoveringStop(undefined);
                }}
                variant={"outlined"}
                component={RouterLink}
                to={`${viewStatePathname}/stop/${stop.stopId}?routeId=${routeId}&directionId=${directionId}`}
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
