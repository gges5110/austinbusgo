import { TableCell, TableRow } from "@mui/material";
import dayjs from "dayjs";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { StopTimes } from "shared/types/interface.d";

interface StopTimeRowProps {
  stopTime: StopTimes;
}

export const StopTimeRow: React.FC<StopTimeRowProps> = ({ stopTime }) => {
  const scheduledArrivalTime = dayjs(stopTime.arrivalTime, "HH:mm:ss");
  const scheduledDepartureTime = dayjs(stopTime.departureTime, "HH:mm:ss");

  return (
    <TableRow>
      <TableCell>{stopTime.stopSequence}</TableCell>
      <TableCell>
        <RouterLink
          style={{ textDecoration: "none", color: "inherit" }}
          to={`/stop/${stopTime.stopId}`}
        >
          {stopTime.stop.stopName}
        </RouterLink>
      </TableCell>
      <TableCell>{stopTime.stopId}</TableCell>
      <TableCell>{scheduledArrivalTime.format("h:mm:ss A")}</TableCell>
      <TableCell>{scheduledDepartureTime.format("h:mm:ss A")}</TableCell>
    </TableRow>
  );
};
