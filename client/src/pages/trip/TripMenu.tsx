import { useMatches, useNavigate } from "react-router-dom";
import { Params } from "@remix-run/router";
import { Box, Divider, IconButton, Slide, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Timeline from "@mui/lab/Timeline";
import { timelineItemClasses } from "@mui/lab";
import dayjs from "dayjs";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import * as React from "react";
import {
  HandleType,
  stopLoader,
  tripLoader,
  useDataFromLoader,
} from "../../App";

export const TripMenu = () => {
  const { trip, stopTimes } = useDataFromLoader(tripLoader);
  const matches = useMatches() as {
    id: string;
    pathname: string;
    params: Params;
    data: unknown;
    handle: HandleType;
  }[];
  const stop = matches
    .filter((match) => Boolean(match.handle?.stop))
    .map((match) =>
      match.handle?.stop?.(match.data as Awaited<ReturnType<typeof stopLoader>>)
    )[0];

  const navigate = useNavigate();
  const onBack = () => {
    navigate(-1);
  };
  return (
    <Box
      sx={{
        backgroundColor: "#FFF",
        maxHeight: "80vh",
        width: "408px",
        m: 4,
        mt: 2,
        overflow: "hidden",
        borderRadius: 2.5,
      }}
    >
      <Slide direction="right" in={true} mountOnEnter unmountOnExit>
        <div>
          <Box
            sx={{
              py: 1,
              boxShadow: 2,
              width: "100%",
            }}
          >
            <Tooltip title={"Back"}>
              <IconButton onClick={onBack}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            {stop?.stopName}
            {trip.routeId} {trip.route.routeLongName}
            <Divider />
            <Box sx={{ overflowY: "auto", maxHeight: "80vh" }}>
              <Timeline
                sx={{
                  [`& .${timelineItemClasses.root}:before`]: {
                    flex: 0,
                    padding: 0,
                  },
                }}
              >
                {stopTimes?.map((stopTime, index) => {
                  const arrivalTime = dayjs(stopTime.arrivalTime, "HH:mm:ss");
                  return (
                    <TimelineItem key={stopTime.stopId}>
                      <TimelineSeparator>
                        <TimelineDot color={"primary"} />
                        {index !== stopTimes.length - 1 && (
                          <TimelineConnector />
                        )}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>{stopTime.stop.stopName}</span>{" "}
                          <span>{arrivalTime.format("LT")}</span>
                        </Box>
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </Box>
          </Box>
        </div>
      </Slide>
    </Box>
  );
};
