import {
  createTheme,
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import * as React from "react";
import { ApolloProvider } from "@apollo/client";
import { SnackbarProvider } from "notistack";
import { RouterProvider } from "react-router-dom";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import { client, router } from "./Router";
import { colorModeAtom } from "./Atoms";
import { useAtomValue } from "jotai";

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

dayjs.extend(LocalizedFormat);

export const App: React.FunctionComponent = () => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const mode = useAtomValue(colorModeAtom);
  const theme = useTheme();

  const appTheme = React.useMemo(
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

  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          preventDuplicate={true}
          autoHideDuration={2000}
        >
          <RouterProvider router={router} />
        </SnackbarProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
};
