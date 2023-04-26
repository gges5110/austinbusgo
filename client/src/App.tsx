import { createMuiTheme, MuiThemeProvider } from "@material-ui/core";
import * as React from "react";
import { Page } from "./components/Page";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { SnackbarProvider } from "notistack";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const client = new ApolloClient({
  uri:
    process.env.REACT_APP_API_BASE !== undefined
      ? `${process.env.REACT_APP_API_BASE}/graphql`
      : "/graphql",
  cache: new InMemoryCache(),
});

export const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#2196f3",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

export const App: React.FunctionComponent = () => {
  const router = createBrowserRouter([
    { path: "/", element: <Page /> },
    { path: "/route/:routeId/direction/:directionId", element: <Page /> },
    { path: "/stop/:stopId", element: <Page /> },
  ]);

  return (
    <ApolloProvider client={client}>
      <MuiThemeProvider theme={theme}>
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
      </MuiThemeProvider>
    </ApolloProvider>
  );
};
