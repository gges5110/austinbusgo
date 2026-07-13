import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React from "react";
import { useStopTimes, useTrip } from "shared/api/generated/api";

import { StopTimeRow } from "./StopTimeRow";

interface TripAccordionProps {
  tripId: string;
  routeColor: string;
}

export const TripAccordion: React.FC<TripAccordionProps> = ({
  tripId,
  routeColor,
}) => {
  const { data: trip } = useTrip(tripId, {
    query: { enabled: !!tripId },
  });

  const { data: stopTimesData } = useStopTimes(tripId, {
    query: { enabled: !!tripId },
  });
  const stopTimes = stopTimesData || [];

  if (!trip) {
    return null;
  }

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}
        >
          <Chip
            label={trip.route.routeId}
            size={"small"}
            sx={{
              backgroundColor: `#${routeColor}`,
              color: "white",
              fontWeight: 600,
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant={"body1"}>{trip.tripHeadsign}</Typography>
            <Typography color={"text.secondary"} variant={"caption"}>
              {"Trip ID: "}
              {trip.tripId}
              {" • Direction: "}
              {trip.directionId}
              {" • "}
              {stopTimes.length}
              {" stops"}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer>
          <Table size={"small"}>
            <TableHead>
              <TableRow>
                <TableCell>Seq</TableCell>
                <TableCell>Stop Name</TableCell>
                <TableCell>Stop ID</TableCell>
                <TableCell>Arrival Time</TableCell>
                <TableCell>Departure Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stopTimes.map((stopTime) => (
                <StopTimeRow
                  key={`${stopTime.tripId}-${stopTime.stopSequence}`}
                  stopTime={stopTime}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
};
