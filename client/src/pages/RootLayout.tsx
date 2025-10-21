import { Box, IconButton, Paper, Popper, useTheme } from "@mui/material";
import * as React from "react";
import { SettingsDialog } from "../features/settings/components/SettingsDialog/SettingsDialog";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useAtom } from "jotai";
import {
  isAutoPollingAtom,
  settingsDialogOpenAtom,
} from "../shared/state/atoms";
import { MapWrapper } from "../features/map/components/Map/MapWrapper";
import { useViewStatePathname } from "../shared/hooks/UseViewStatePathname";
import { SearchPanel } from "../features/search/components/SearchPanel/SearchPanel";
import SettingsIcon from "@mui/icons-material/Settings";
import { Route, Stop } from "../shared/types/interface.d";
import { useRecentSearches } from "../shared/hooks/UseRecentSearches";
import { useDataFromLoaders } from "../shared/hooks/UseDataFromLoaders";
import { ErrorBoundary } from "../shared/components/ErrorBoundary";

export const RootLayout: React.FunctionComponent = () => {
  const [autoPolling, setAutoPolling] = useAtom(isAutoPollingAtom);
  const [settingsDialogOpen, setSettingsDialogOpen] = useAtom(
    settingsDialogOpenAtom
  );

  const { routeId, directionId, searchTerm } = useParams();
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();
  const theme = useTheme();
  const { addToRecentSearches } = useRecentSearches();

  const setStop = (stop: Stop) => {
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

  const setRoute = (route: Route) => {
    if (route) {
      navigate(`${viewStatePathname}/route/${route?.routeId}/direction/0`);
    }
  };

  const {
    reloadVehiclePositions,
    stop,
    stops,
    route,
    routeShapes,
    vehiclePositions,
  } = useDataFromLoaders();

  return (
    <ErrorBoundary>
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
          <IconButton
            onClick={() => {
              setSettingsDialogOpen(true);
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Paper>
        <MapWrapper
          route={route}
          routeShapes={routeShapes}
          setSelectedStop={setStop}
          stop={stop}
          stops={stops}
          vehiclePositions={vehiclePositions}
        />
        <Popper open={true}>
          <Outlet />
        </Popper>
        <Popper open={true} sx={{ zIndex: 2 }}>
          <SearchPanel
            route={route}
            searchTerm={searchTerm}
            setRoute={setRoute}
            setStop={setStop}
            stop={stop}
          />
        </Popper>

        <SettingsDialog
          autoPolling={autoPolling}
          open={settingsDialogOpen}
          reloadVehiclePositions={reloadVehiclePositions}
          setAutoPolling={setAutoPolling}
          setOpen={setSettingsDialogOpen}
        />
      </Box>
    </ErrorBoundary>
  );
};
