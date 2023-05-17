import { CssBaseline, ThemeProvider } from "@mui/material";
import * as React from "react";
import { SnackbarProvider } from "notistack";
import { RouterProvider } from "react-router-dom";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import { router } from "./Router";
import { useAppTheme } from "./hooks/UseAppTheme";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./QueryClient";

dayjs.extend(LocalizedFormat);

export const App: React.FunctionComponent = () => {
  const appTheme = useAppTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline enableColorScheme={true} />
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
