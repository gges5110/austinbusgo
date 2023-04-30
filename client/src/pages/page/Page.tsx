import { Box, Popper } from "@mui/material";
import { SnackbarKey, useSnackbar } from "notistack";
import * as React from "react";
import { useState } from "react";
import { useVehiclePositionsLazyQuery } from "../../schemas/VehiclePositions.generated";
import { LoadingSnackbarMessage } from "../../components/LoadingSnackbarMessage";
import { SettingsDialog } from "../../components/SettingsDialog";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useAtom } from "jotai";
import {
  isAutoPollingAtom,
  selectedRouteAtom,
  settingsDialogOpenAtom,
} from "../../Atoms";
import { MapWrapper } from "../../components/Map/MapWrapper";
import { routeLoader, stopLoader, useDataFromRouteLoader } from "../../App";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";

const defaultAutoPollingInterval = 15000;

export const Page: React.FunctionComponent = () => {
  const [autoPolling, setAutoPolling] = useAtom(isAutoPollingAtom);
  const [settingsDialogOpen, setSettingsDialogOpen] = useAtom(
    settingsDialogOpenAtom
  );
  const [selectedRoute, setSelectedRoute] = useAtom(selectedRouteAtom);

  const { routeId, directionId } = useParams();
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();

  const setStop = (stopId: number | undefined) => {
    if (stopId !== undefined && location.pathname.includes("/routes")) {
      navigate(
        `${viewStatePathname}/routes/${routeId}/direction/${directionId}/stops/${stopId}`
      );
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
          routeId: Number(selectedRoute.routeId),
          direction: toBoolean(directionId),
        },
      });
      setSettingsDialogOpen(false);
    }
  };

  const routeLoaderData = useDataFromRouteLoader("route", routeLoader);
  const stopOnRouteLoaderData = useDataFromRouteLoader(
    "stopOnRoute",
    stopLoader
  );
  const stopLoaderData = useDataFromRouteLoader("stop", stopLoader);

  setSelectedRoute(routeLoaderData?.route);
  const stop = stopOnRouteLoaderData?.data.stop || stopLoaderData?.data.stop;
  const stops = routeLoaderData?.stops || (stop ? [stop] : []);
  const routeShapes = routeLoaderData?.shapes || [];
  const vehiclePositions =
    (selectedRoute && vehiclePositionsData?.vehiclePositions) || [];

  return (
    <Box sx={{ display: "flex", height: "100%", width: "100%" }}>
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

export const toBoolean = (value: string | undefined): boolean => {
  return value === "true" || value === "1";
};

export const getDate = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    ("0" + (d.getMonth() + 1)).slice(-2),
    ("0" + d.getDate()).slice(-2),
  ].join("");
};
