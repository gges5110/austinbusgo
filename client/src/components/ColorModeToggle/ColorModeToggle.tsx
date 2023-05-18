import { IconButton, useTheme } from "@mui/material";
import { useSetAtom } from "jotai/index";
import { colorModeAtom } from "../../Atoms";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import * as React from "react";

export const ColorModeToggle = () => {
  const theme = useTheme();
  const setMode = useSetAtom(colorModeAtom);

  return (
    <IconButton
      onClick={() => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      }}
      color={"inherit"}
    >
      {theme.palette.mode === "dark" ? (
        <Brightness7Icon />
      ) : (
        <Brightness4Icon />
      )}
    </IconButton>
  );
};
