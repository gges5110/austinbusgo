import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import * as React from "react";
import { useEffect, useState } from "react";
import { StopsAndShapesQuery } from "shared/api/schemas/StopsAndRouteShapes.generated";
import { Trip } from "shared/types/interface.d";

interface DirectionToggleProps {
  directionId: Trip["directionId"];

  setDirection(directionId: Trip["directionId"]): void;

  distinctTrips: StopsAndShapesQuery["distinctTrips"];
}

export const DirectionToggle: React.FC<DirectionToggleProps> = ({
  directionId,
  setDirection,
  distinctTrips,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = (event.target as HTMLInputElement).value;
    event.currentTarget.blur();
    setValue(Number(value));
    setDirection(Number(value));
  };

  const [value, setValue] = useState<number>(0);
  useEffect(() => {
    if (directionId) {
      setValue(directionId);
    }
  }, [directionId]);

  return (
    <FormControl>
      <FormLabel id={"direction-radio-buttons-group"}>Direction</FormLabel>
      <RadioGroup
        aria-labelledby={"direction-radio-buttons-group"}
        name={"direction-radio-buttons-group"}
        onChange={handleChange}
        value={value}
      >
        {distinctTrips?.map((distinctTrip, index) => {
          return (
            <FormControlLabel
              control={<Radio size={"small"} />}
              key={index}
              label={distinctTrip.tripShortName}
              value={distinctTrip.directionId}
            />
          );
        })}
      </RadioGroup>
    </FormControl>
  );
};
