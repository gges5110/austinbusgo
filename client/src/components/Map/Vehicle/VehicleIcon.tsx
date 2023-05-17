import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
import React, { MouseEventHandler } from "react";

const readBearing = (bearing: number): string => {
  let bearingStr = "N";
  const binHalfWidth: number = 45 / 2;
  const bearingList: string[] = ["NE", "E", "SE", "S", "SW", "W", "NW"];
  for (let i = 0; i < bearingList.length; i++) {
    if (
      bearing >= 45 * (i + 1) - binHalfWidth &&
      bearing < 45 * (i + 1) + binHalfWidth
    ) {
      bearingStr = bearingList[i];
    }
  }
  return bearingStr;
};

export interface VehicleIconProps {
  readonly bearing: number;

  onClick?(event: React.MouseEvent<HTMLButtonElement>): void;

  highlighted?: boolean;

  onMouseEnter?: MouseEventHandler<HTMLButtonElement> | undefined;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement> | undefined;
}

export const VehicleIcon: React.FunctionComponent<VehicleIconProps> = ({
  onClick,
  bearing,
  highlighted,
  onMouseEnter,
  onMouseLeave,
}) => {
  const bearingString: string = readBearing(bearing);

  const isN = bearingString === "N";
  const isS = bearingString === "S";
  const isNW = bearingString === "NW";
  const isNE = bearingString === "NE";
  const isE = bearingString === "E";
  const isW = bearingString === "W";
  const isSW = bearingString === "SW";
  const isSE = bearingString === "SE";
  return (
    <IconButton
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      size={highlighted ? "medium" : "small"}
      sx={{
        backgroundColor: "background.default",
        "&:hover": {
          backgroundColor: "background.default",
          opacity: "80%",
        },
      }}
    >
      <SvgIcon viewBox="0.299 123.962 595.28 595.28">
        <path
          d="M481.435,321.277h-6.27v-37.622c0-35.114-77.753-62.704-175.569-62.704c-97.818,0-175.569,27.59-175.569,62.704v37.622
    h-6.271c-10.386,0-18.811,8.419-18.811,18.812v62.702c0,10.387,8.425,18.813,18.811,18.813h6.271V547.01
    c0,13.849,11.231,25.081,25.081,25.081v25.081c0,13.85,11.231,25.081,25.081,25.081h25.081c13.85,0,25.081-11.231,25.081-25.081
    v-25.081h150.487v25.081c0,13.85,11.232,25.081,25.081,25.081H425c13.85,0,25.082-11.231,25.082-25.081v-25.081h5.015
    c12.541,0,20.066-10.033,20.066-20.065V421.602h6.27c10.387,0,18.811-8.425,18.811-18.812v-62.701
    C500.244,329.696,491.821,321.277,481.435,321.277z M186.731,534.467c-13.851,0-25.082-11.229-25.082-25.079
    c0-13.851,11.231-25.081,25.082-25.081c13.849,0,25.08,11.23,25.08,25.081C211.811,523.237,200.579,534.467,186.731,534.467z
     M199.27,446.684c-13.85,0-25.081-11.232-25.081-25.082V321.277c0-13.849,11.231-25.081,25.081-25.081h200.65
    c13.85,0,25.081,11.232,25.081,25.081v100.325c0,13.85-11.231,25.082-25.081,25.082H199.27z M412.461,534.467
    c-13.85,0-25.081-11.229-25.081-25.079c0-13.851,11.231-25.081,25.081-25.081s25.082,11.23,25.082,25.081
    C437.543,523.237,426.311,534.467,412.461,534.467z"
        />

        {isN && (
          <polygon points="191.753,207.03 299.596,123.962 407.437,207.03 " />
        )}
        {isS && (
          <polygon points="191.753,636.174 299.596,719.242 407.437,636.174 " />
        )}
        {isW && (
          <polygon points="83.367,529.444 0.299,421.602 83.367,313.759 " />
        )}
        {isE && (
          <polygon points="512.511,529.444 595.579,421.602 512.511,313.759 " />
        )}
        {isNW && (
          <polygon points="43.489,308.384 61.007,173.391 196,155.872 " />
        )}
        {isSE && (
          <polygon points="403.189,687.332 538.181,669.813 555.7,534.82 " />
        )}
        {isSW && <polygon points="196,687.332 61.006,669.813 43.489,534.82 " />}
        {isNE && (
          <polygon points="555.7,308.384 538.181,173.391 403.189,155.872 " />
        )}
      </SvgIcon>
    </IconButton>
  );
};
