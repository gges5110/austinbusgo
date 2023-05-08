import { Box, Paper, Popper, useTheme } from "@mui/material";
import { SnackbarKey, useSnackbar } from "notistack";
import * as React from "react";
import { useEffect, useState } from "react";
import { useVehiclePositionsLazyQuery } from "../schemas/VehiclePositions.generated";
import { LoadingSnackbarMessage } from "../components/LoadingSnackbarMessage";
import { SettingsDialog } from "../components/SettingsDialog";
import { Outlet, useMatches, useNavigate, useParams } from "react-router-dom";
import { useAtom } from "jotai";
import {
  isAutoPollingAtom,
  selectedRouteAtom,
  settingsDialogOpenAtom,
} from "../Atoms";
import { MapWrapper } from "../components/Map/MapWrapper";
import { useViewStatePathname } from "../hooks/UseViewStatePathname";
import { Params } from "@remix-run/router";
import { client, HandleType } from "../Router";
import { stopLoader } from "./stop/StopMenu";
import { routeLoader } from "./route/RouteMenu";
import { ColorModeToggle } from "../components/ColorModeToggle/ColorModeToggle";
import { SearchPanel } from "../components/SearchPanel/SearchPanel";
import { RoutesDocument, RoutesQuery } from "../schemas/Routes.generated";

const defaultAutoPollingInterval = 15000;

export const routesLoader = async () => {
  return await client.query<RoutesQuery>({ query: RoutesDocument });
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
      if (location.pathname.includes("/routes")) {
        navigate(
          `${viewStatePathname}/routes/${routeId}/direction/${directionId}/stops/${stopId}`
        );
      } else {
        navigate(`${viewStatePathname}/stops/${stopId}`);
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

  const matches = useMatches() as {
    id: string;
    pathname: string;
    params: Params;
    data: unknown;
    handle: HandleType;
  }[];
  const stop = matches
    .filter((match) => Boolean(match.handle?.stop))
    .map((match) =>
      match.handle?.stop?.(match.data as Awaited<ReturnType<typeof stopLoader>>)
    )[0];

  const route = matches
    .filter((match) => Boolean(match.handle?.route))
    .map((match) =>
      match.handle?.route?.(
        match.data as Awaited<ReturnType<typeof routeLoader>>
      )
    )[0];

  const stops =
    matches
      .filter((match) => Boolean(match.handle?.stops))
      .map((match) =>
        match.handle?.stops?.(
          match.data as Awaited<ReturnType<typeof routeLoader>>
        )
      )[0] || (stop ? [stop] : []);

  const routeShapes =
    matches
      .filter((match) => Boolean(match.handle?.shapes))
      .map((match) =>
        match.handle?.shapes?.(
          match.data as Awaited<ReturnType<typeof routeLoader>>
        )
      )[0] || [];

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
                `${viewStatePathname}/routes/${route?.routeId}/direction/0`
              );
            }
          }}
          stop={stop}
          setStop={(stop) => {
            if (stop) {
              navigate(`${viewStatePathname}/stops/${stop.stopId}`);
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
