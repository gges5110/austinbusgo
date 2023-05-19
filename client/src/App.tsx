import { CssBaseline, ThemeProvider } from "@mui/material";
import * as React from "react";
import { SnackbarProvider } from "notistack";
import { RouterProvider } from "react-router-dom";
import { router } from "./Router";
import { useAppTheme } from "./hooks/UseAppTheme";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./QueryClient";

export const App: React.FunctionComponent = () => {
  const appTheme = useAppTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline enableColorScheme={true} />
        <SnackbarProvider
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          autoHideDuration={2000}
          maxSnack={3}
          preventDuplicate={true}
        >
          <RouterProvider router={router} />
        </SnackbarProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
