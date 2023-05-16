import { Box, IconButton, Paper, Popper, useTheme } from "@mui/material";
import { SnackbarKey, useSnackbar } from "notistack";
import * as React from "react";
import { useState } from "react";
import { SettingsDialog } from "../components/SettingsDialog";
import {
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAtom } from "jotai";
import {
  isAutoPollingAtom,
  selectedRouteAtom,
  settingsDialogOpenAtom,
} from "../Atoms";
import { MapWrapper } from "../components/Map/MapWrapper";
import { useViewStatePathname } from "../hooks/UseViewStatePathname";
import { useDataFromRouteLoader } from "../Router";
import { ColorModeToggle } from "../components/ColorModeToggle/ColorModeToggle";
import { SearchPanel } from "../components/SearchPanel/SearchPanel";
import { useVehiclePositionsQuery } from "../schemas/VehiclePositions.generated";
import { routeLoader } from "./route/RouteLoader";
import { stopLoader } from "./stop/StopLoader";
import { rootLoader } from "./RootLoader";
import SettingsIcon from "@mui/icons-material/Settings";
import { useQueryClient } from "@tanstack/react-query";
import { Stop } from "../interfaces/interface.d";
import { useRecentSearches } from "../hooks/UseRecentSearches";

export const RootLayout: React.FunctionComponent = () => {
  const [autoPolling, setAutoPolling] = useAtom(isAutoPollingAtom);
  const [settingsDialogOpen, setSettingsDialogOpen] = useAtom(
    settingsDialogOpenAtom
  );
  const [selectedRoute, setSelectedRoute] = useAtom(selectedRouteAtom);

  const { routeId, directionId, searchTerm } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();
  const theme = useTheme();
  const { addToRecentSearches } = useRecentSearches();

  const setSelectedStop = (stop: Stop) => {
    const { stopId } = stop;

    if (stopId !== undefined) {
      addToRecentSearches(stop);
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
  const { data: vehiclePositionsData } = useVehiclePositionsQuery(
    {
      routeId: selectedRoute?.routeId || "1",
      direction: Number(searchParams.get("directionId")),
    },
    {
      enabled: selectedRoute !== undefined,
      refetchInterval: autoPolling ? 15000 : false,
      onSuccess: (vehiclePositions) => {
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
    }
  );

  const queryClient = useQueryClient();
  const reloadVehiclePositions = () => {
    const key = enqueueSnackbar("Reloading Vehicles...", {
      variant: "info",
    });
    setVehiclePositionsLoadingSnackbarKey(key);
    queryClient.invalidateQueries({
      queryKey: [
        "VehiclePositions",
        {
          routeId: routeId,
          direction: Number(directionId),
        },
      ],
    });
  };

  const stopData = useDataFromRouteLoader("stop", stopLoader);
  const stop = stopData?.stop;

  const routeData = useDataFromRouteLoader("route", routeLoader);
  const rootData = useDataFromRouteLoader("root", rootLoader);

  const route = rootData?.route || routeData?.route;
  const stops =
    rootData?.stops || routeData?.stops || (stop !== undefined ? [stop] : []);
  const routeShapes = rootData?.shapes || routeData?.shapes || [];

  setSelectedRoute(route);

  const vehiclePositions =
    rootData?.vehiclePositions || vehiclePositionsData?.vehiclePositions || [];
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
        <IconButton
          onClick={() => {
            setSettingsDialogOpen(true);
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Paper>
      <MapWrapper
        stops={stops}
        routeShapes={routeShapes}
        vehiclePositions={vehiclePositions}
        route={selectedRoute}
        stop={stop}
        setSelectedStop={setSelectedStop}
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
