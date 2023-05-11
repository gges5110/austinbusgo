import { Box, Paper, Popper, useTheme } from "@mui/material";
import { SnackbarKey, useSnackbar } from "notistack";
import * as React from "react";
import { useEffect, useState } from "react";
import { useVehiclePositionsLazyQuery } from "../schemas/VehiclePositions.generated";
import { LoadingSnackbarMessage } from "../components/LoadingSnackbarMessage";
import { SettingsDialog } from "../components/SettingsDialog";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useAtom } from "jotai";
import {
  isAutoPollingAtom,
  selectedRouteAtom,
  settingsDialogOpenAtom,
} from "../Atoms";
import { MapWrapper } from "../components/Map/MapWrapper";
import { useViewStatePathname } from "../hooks/UseViewStatePathname";
import { client, useDataFromRouteLoader } from "../Router";
import { stopLoader } from "./stop/StopMenu";
import { routeLoader } from "./route/RouteMenu";
import { ColorModeToggle } from "../components/ColorModeToggle/ColorModeToggle";
import { SearchPanel } from "../components/SearchPanel/SearchPanel";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import {
  RouteDocument,
  RouteQuery,
  RouteQueryVariables,
} from "../schemas/Route.generated";
import {
  StopsAndShapesDocument,
  StopsAndShapesQuery,
  StopsAndShapesQueryVariables,
} from "../schemas/StopsAndRouteShapes.generated";

const defaultAutoPollingInterval = 15000;

export const routeSearchParamsLoader = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const routeId = url.searchParams.get("routeId") || "";
  const directionId = Number(url.searchParams.get("directionId") || "");

  if (routeId === "") {
    return {};
  }

  const routeQuery = client.query<RouteQuery, RouteQueryVariables>({
    query: RouteDocument,
    variables: {
      routeId,
    },
  });
  const stopsAndShapesQuery = client.query<
    StopsAndShapesQuery,
    StopsAndShapesQueryVariables
  >({
    query: StopsAndShapesDocument,
    variables: {
      routeId,
      directionId,
      date: getDate(),
    },
  });

  let routeData, stopsAndShapesData;
  if (routeId !== "") {
    routeData = (await routeQuery).data;
    stopsAndShapesData = (await stopsAndShapesQuery).data;
  }

  return {
    route: routeData?.route,
    shapes: stopsAndShapesData?.stopsAndShapes.shapes,
    stops: stopsAndShapesData?.stopsAndShapes.stops,
    distinctTrips: stopsAndShapesData?.distinctTrips,
  };
};
export const RootLayout: React.FunctionComponent = () => {
  const [autoPolling, setAutoPolling] = useAtom(isAutoPollingAtom);
  const [settingsDialogOpen, setSettingsDialogOpen] = useAtom(
    settingsDialogOpenAtom
  );
  const [selectedRoute, setSelectedRoute] = useAtom(selectedRouteAtom);

  const { routeId, directionId, searchTerm } = useParams();
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();
  const theme = useTheme();

  const setStop = (stopId: string | undefined) => {
    if (stopId !== undefined) {
      if (location.pathname.includes("/route")) {
        navigate(
          `${viewStatePathname}/stop/${stopId}?routeId=${routeId}&directionId=${directionId}`
        );
      } else {
        navigate(`${viewStatePathname}/stop/${stopId}`);
      }
    }
  };
  const [
    vehiclePositionsLoadingSnackbarKey,
    setVehiclePositionsLoadingSnackbarKey,
  ] = useState<SnackbarKey | undefined>(undefined);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [
    getVehiclePositions,
    { data: vehiclePositionsData },
  ] = useVehiclePositionsLazyQuery({
    fetchPolicy: "network-only",
    pollInterval: autoPolling ? defaultAutoPollingInterval : 0,
    onCompleted: (vehiclePositions) => {
      if (vehiclePositions) {
        if (vehiclePositionsLoadingSnackbarKey) {
          closeSnackbar(vehiclePositionsLoadingSnackbarKey);
          setVehiclePositionsLoadingSnackbarKey(undefined);
        }

        enqueueSnackbar("Vehicle Position Updated", {
          variant: "success",
        });
      }
    },
  });

  useEffect(() => {
    if (selectedRoute) {
      getVehiclePositions({
        variables: {
          routeId: selectedRoute.routeId,
          direction: Number(directionId),
        },
      });
    }
  }, [selectedRoute]);

  const reloadVehiclePositions = (): void => {
    if (selectedRoute) {
      const key = enqueueSnackbar(
        <LoadingSnackbarMessage message={"Reloading..."} />,
        {
          variant: "info",
          autoHideDuration: undefined,
        }
      );
      setVehiclePositionsLoadingSnackbarKey(key);
      getVehiclePositions({
        variables: {
          routeId: selectedRoute.routeId,
          direction: Number(directionId),
        },
      });
      setSettingsDialogOpen(false);
    }
  };

  const stopData = useDataFromRouteLoader("stop", stopLoader);
  const stop = stopData?.data.stop;

  const routeData = useDataFromRouteLoader("route", routeLoader);
  const routeSearchParamsData = useDataFromRouteLoader(
    "routeSearchParams",
    routeSearchParamsLoader
  );

  const route = routeSearchParamsData?.route || routeData?.route;
  const stops =
    routeSearchParamsData?.stops ||
    routeData?.stops ||
    (stop !== undefined ? [stop] : []);
  const routeShapes = routeSearchParamsData?.shapes || routeData?.shapes || [];

  setSelectedRoute(route);
  const vehiclePositions =
    (selectedRoute && vehiclePositionsData?.vehiclePositions) || [];
  return (
    <Box sx={{ display: "flex", height: "100%", width: "100%" }}>
      <Paper
        sx={{
          color: "text.primary",
          borderRadius: 1,
          position: "absolute",
          zIndex: 1,
          top: theme.spacing(2),
          right: theme.spacing(2),
        }}
      >
        <ColorModeToggle />
      </Paper>
      <MapWrapper
        stops={stops}
        routeShapes={routeShapes}
        vehiclePositions={vehiclePositions}
        route={selectedRoute}
        stop={stop}
        setSelectedStopId={setStop}
      />
      <Popper open={true}>
        <Outlet />
      </Popper>
      <Popper open={true} sx={{ zIndex: 2 }}>
        <SearchPanel
          searchTerm={searchTerm}
          route={route}
          setRoute={(route) => {
            if (route) {
              navigate(
                `${viewStatePathname}/route/${route?.routeId}/direction/0`
              );
            }
          }}
          stop={stop}
          setStop={(stop) => {
            if (stop) {
              navigate(`${viewStatePathname}/stop/${stop.stopId}`);
            }
          }}
        />
      </Popper>

      <SettingsDialog
        open={settingsDialogOpen}
        autoPolling={autoPolling}
        reloadVehiclePositions={reloadVehiclePositions}
        setOpen={setSettingsDialogOpen}
        setAutoPolling={setAutoPolling}
      />
    </Box>
  );
};
export const getDate = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    ("0" + (d.getMonth() + 1)).slice(-2),
    ("0" + d.getDate()).slice(-2),
  ].join("");
};
