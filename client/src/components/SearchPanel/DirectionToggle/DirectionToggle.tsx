import * as React from "react";
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { StopsAndShapesQuery } from "../../../schemas/StopsAndRouteShapes.generated";
import { useEffect, useState } from "react";
import { Trip } from "../../../interfaces/interface.d";

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
      <FormLabel>Direction</FormLabel>
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
