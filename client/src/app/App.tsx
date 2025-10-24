import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "app/QueryClient";
import { router } from "app/Router";
import { useAtomValue } from "jotai";
import { SnackbarProvider } from "notistack";
import * as React from "react";
import { RouterProvider } from "react-router-dom";
import { useAppTheme } from "app/hooks/useAppTheme";
import { showReactQueryDevtoolsAtom } from "shared/state/atoms";

export const App: React.FunctionComponent = () => {
  const appTheme = useAppTheme();
  const showReactQueryDevtools = useAtomValue(showReactQueryDevtoolsAtom);

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
      {showReactQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};
