import { createTheme, useMediaQuery, useTheme } from "@mui/material";
import { useAtomValue } from "jotai";
import { colorModeAtom } from "../Atoms";
import * as React from "react";

declare module "@mui/material/styles" {
  interface Palette {
    neutral: Palette["primary"];
  }

  interface PaletteOptions {
    neutral: PaletteOptions["primary"];
  }

  interface PaletteColor {
    darker?: string;
  }

  interface SimplePaletteColorOptions {
    darker?: string;
  }
}
declare module "@mui/material/IconButton" {
  interface IconButtonPropsColorOverrides {
    neutral: true;
  }
}
declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    neutral: true;
  }
}

declare module "@mui/material/SvgIcon" {
  interface SvgIconPropsColorOverrides {
    neutral: true;
  }
}

export const useAppTheme = () => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const mode = useAtomValue(colorModeAtom);
  const theme = useTheme();

  return React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: mode,
          neutral: {
            main: "#64748B",
          },
        },
        typography: {
          fontFamily: [
            "Open Sans",
            "sans-serif",
            '"Helvetica Neue"',
            "Arial",
            "-apple-system",
          ].join(","),
        },
        components: {
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                backgroundColor:
                  mode === "light" ? theme.palette.text.primary : undefined,
                fontSize: 14,
              },
            },
          },
        },
      }),
    [prefersDarkMode, mode]
  );
};
