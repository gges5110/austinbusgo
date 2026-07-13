import { TableCell, TableRow } from "@mui/material";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { StopTimes } from "shared/types/interface.d";
import { parseArrivalTime } from "shared/utils/dateUtils";

interface StopTimeRowProps {
  stopTime: StopTimes;
}

export const StopTimeRow: React.FC<StopTimeRowProps> = ({ stopTime }) => {
  const scheduledArrivalTime = parseArrivalTime(stopTime.arrivalTime);
  const scheduledDepartureTime = parseArrivalTime(stopTime.departureTime);

  return (
    <TableRow>
      <TableCell>{stopTime.stopSequence}</TableCell>
      <TableCell>
        <RouterLink
          style={{ textDecoration: "none", color: "inherit" }}
          to={`/stop/${stopTime.stopId}`}
        >
          {stopTime.stop?.stopName}
        </RouterLink>
      </TableCell>
      <TableCell>{stopTime.stopId}</TableCell>
      <TableCell>{scheduledArrivalTime.format("h:mm:ss A")}</TableCell>
      <TableCell>{scheduledDepartureTime.format("h:mm:ss A")}</TableCell>
    </TableRow>
  );
};
