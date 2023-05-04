import * as React from "react";
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { StopsAndShapesQuery } from "../../schemas/StopsAndRouteShapes.generated";
import { toBoolean } from "../../pages/page/RootLayout";
import { useEffect, useState } from "react";

interface DirectionToggleProps {
  direction: boolean;

  setDirection(direction: boolean): void;

  distinctTrips: StopsAndShapesQuery["distinctTrips"];
}

export const DirectionToggle: React.FC<DirectionToggleProps> = ({
  direction,
  setDirection,
  distinctTrips,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = (event.target as HTMLInputElement).value;
    event.currentTarget.blur();
    setValue(toBoolean(value));
    setDirection(toBoolean(value));
  };

  const [value, setValue] = useState<boolean>(false);
  useEffect(() => {
    setValue(direction);
  }, [direction]);

  return (
    <FormControl>
      <FormLabel>Direction</FormLabel>
      <RadioGroup
        aria-labelledby="direction-radio-buttons-group"
        name="direction-radio-buttons-group"
        value={value}
        onChange={handleChange}
      >
        {distinctTrips?.map((distinctTrip, index) => {
          return (
            <FormControlLabel
              key={index}
              value={distinctTrip.directionId}
              control={<Radio size="small" />}
              label={distinctTrip.tripShortName}
            />
          );
        })}
      </RadioGroup>
    </FormControl>
  );
};
