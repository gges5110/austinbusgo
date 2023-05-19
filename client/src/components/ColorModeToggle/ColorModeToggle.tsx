import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { colorModeAtom, ColorModeType } from "../../Atoms";
import * as React from "react";
import LightModeIcon from "@mui/icons-material/LightMode";
import SettingsSystemDaydreamIcon from "@mui/icons-material/SettingsSystemDaydream";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useAtom } from "jotai";

export const ColorModeToggle = () => {
  const [mode, setMode] = useAtom(colorModeAtom);

  const handleColorMode = (
    event: React.MouseEvent<HTMLElement>,
    newColorMode: ColorModeType | null
  ) => {
    if (newColorMode) {
      setMode(newColorMode);
    }
  };

  return (
    <ToggleButtonGroup
      aria-label={"color mode"}
      color={"primary"}
      exclusive={true}
      onChange={handleColorMode}
      value={mode}
    >
      <ToggleButton aria-label={"light mode"} value={"light"}>
        <LightModeIcon /> Light
      </ToggleButton>
      <ToggleButton aria-label={"system"} value={"system"}>
        <SettingsSystemDaydreamIcon /> System
      </ToggleButton>
      <ToggleButton aria-label={"dark mode"} value={"dark"}>
        <DarkModeIcon /> Dark
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
