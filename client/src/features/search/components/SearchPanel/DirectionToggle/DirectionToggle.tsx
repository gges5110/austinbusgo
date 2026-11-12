import { ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import * as React from "react";
import { StopsAndShapes } from "shared/api/generated/model";
import { Route, Trip } from "shared/types/interface.d";
import { directionLabel } from "shared/utils/routeNames";

interface DirectionToggleProps {
  directionId: Trip["directionId"];
  distinctTrips: StopsAndShapes["distinctTrips"];
  route: Pick<Route, "routeId" | "routeLongName">;
  setDirection(directionId: Trip["directionId"]): void;
}

/**
 * Which way along the route: "To Tech Ridge Park & Ride · Northbound"
 * rather than GTFS codes like "Forty Acres-OB".
 */
export const DirectionToggle: React.FC<DirectionToggleProps> = ({
  directionId,
  distinctTrips,
  route,
  setDirection,
}) => {
  const labels = (distinctTrips ?? []).map((trip) =>
    directionLabel(trip, route)
  );
  // Two directions read the same (e.g. both loops end at one plaza, with no
  // compass word to tell them apart)
  const ambiguous =
    new Set(labels.map((label) => `${label.primary}|${label.secondary ?? ""}`))
      .size < labels.length;
  // A missing or garbled direction in the URL shows the first one
  const selected = Number.isFinite(directionId) ? directionId : 0;

  if (labels.length === 0) return null;

  return (
    <ToggleButtonGroup
      aria-label={"Direction"}
      exclusive={true}
      fullWidth={true}
      onChange={(event, value: number | null) => {
        // Hand keys back to the map (arrows, space) after choosing
        (event.currentTarget as HTMLElement).blur();
        if (value !== null) setDirection(value);
      }}
      size={"small"}
      value={selected}
    >
      {distinctTrips?.map((trip, index) => {
        const label = labels[index];
        const secondary = ambiguous
          ? `Direction ${index + 1}`
          : label.secondary;
        return (
          <ToggleButton
            key={trip.directionId ?? index}
            sx={{
              alignItems: "flex-start",
              flexDirection: "column",
              textAlign: "left",
              textTransform: "none",
            }}
            value={trip.directionId ?? index}
          >
            <Typography sx={{ fontWeight: 600 }} variant={"body2"}>
              {label.primary}
            </Typography>
            {secondary && (
              <Typography color={"text.secondary"} variant={"caption"}>
                {secondary}
              </Typography>
            )}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
};
