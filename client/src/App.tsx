import { CssBaseline, ThemeProvider } from "@mui/material";
import * as React from "react";
import { ApolloProvider } from "@apollo/client";
import { SnackbarProvider } from "notistack";
import { RouterProvider } from "react-router-dom";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import { client, router } from "./Router";
import { useAppTheme } from "./hooks/UseAppTheme";

dayjs.extend(LocalizedFormat);

export const App: React.FunctionComponent = () => {
  const appTheme = useAppTheme();

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
