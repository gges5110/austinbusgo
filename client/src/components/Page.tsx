import { IconButton } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import { SnackbarKey, useSnackbar } from "notistack";
import * as React from "react";
import { ReactNode, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { RunningTrip } from "../interfaces/interface.d";
import { useTripsQuery } from "../schemas/Trips.generated";
import { useStopsLazyQuery } from "../schemas/StopsAndRouteShapes.generated";
import { useVehiclePositionsLazyQuery } from "../schemas/VehiclePositions.generated";
import { LoadingSnackbarMessage } from "./LoadingSnackbarMessage";
import { MapWrapper } from "./Map/Map";
import { SettingsDialog } from "./SettingsDialog";

const defaultAutoPollingInterval = 15000;

export const Page: React.FunctionComponent = () => {
  const [autoPolling, setAutoPolling] = useLocalStorage<boolean>(
    "vehiclePositionAutoPolling",
    false
  );
  const [settingsDialogOpen, setSettingsDialogOpen] = useState<boolean>(false);
  const [selectedTrip, setSelectedTrip] = useState<RunningTrip | undefined>(
    undefined
  );
  const [tripLoadingSnackbarKey, setTripLoadingSnackbarKey] = useState<
    SnackbarKey | undefined
  >(undefined);
  const [
    vehiclePositionsLoadingSnackbarKey,
    setVehiclePositionsLoadingSnackbarKey,
  ] = useState<SnackbarKey | undefined>(undefined);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const action = (key: SnackbarKey): ReactNode => (
    <IconButton aria-label="delete" onClick={(): void => closeSnackbar(key)}>
      <ClearIcon style={{ fontSize: 16 }} />
    </IconButton>
  );

  const { data: tripsResponse, loading } = useTripsQuery({
    pollInterval: defaultAutoPollingInterval,
  });

  const [
    getStopsAndRouteShapes,
    { data: stopsAndRouteShapes },
  ] = useStopsLazyQuery({
    fetchPolicy: "network-only",
    onError: () => {
      if (tripLoadingSnackbarKey) {
        closeSnackbar(tripLoadingSnackbarKey);
        setTripLoadingSnackbarKey(undefined);
      }

      enqueueSnackbar("An error occurred when loading routes", {
        variant: "error",
        action,
      });
    },
    onCompleted: () => {
      if (tripLoadingSnackbarKey) {
        closeSnackbar(tripLoadingSnackbarKey);
        setTripLoadingSnackbarKey(undefined);
      }
    },
  });

  const [
    getVehiclePositions,
    { data: vehiclePositions },
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
          action,
        });
      }
    },
  });

  const setTrip = (trip: RunningTrip | undefined): void => {
    setSelectedTrip(trip);
    if (trip !== undefined) {
      const key = enqueueSnackbar(
        <LoadingSnackbarMessage
          message={`Loading route ${trip.routeLongName}...`}
        />,
        {
          variant: "info",
          autoHideDuration: 30000,
        }
      );
      setTripLoadingSnackbarKey(key);

      getStopsAndRouteShapes({
        variables: {
          tripId: trip.tripId,
        },
      });

      getVehiclePositions({
        variables: {
          routeId: Number(trip.routeId),
          direction: trip.direction,
        },
      });
    }
  };

  const reloadVehiclePositions = (): void => {
    if (selectedTrip) {
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
          routeId: Number(selectedTrip.routeId),
          direction: selectedTrip.direction,
        },
      });
      setSettingsDialogOpen(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", width: "100%" }}>
      <MapWrapper
        openSettingsDialog={() => setSettingsDialogOpen(true)}
        runningTrips={tripsResponse?.trips || []}
        setTrip={setTrip}
        loading={loading}
        stops={(selectedTrip && stopsAndRouteShapes?.stops) || []}
        routeShapes={(selectedTrip && stopsAndRouteShapes?.routeShapes) || []}
        vehiclePositions={
          (selectedTrip && vehiclePositions?.vehiclePositions) || []
        }
        trip={selectedTrip}
      />
      <SettingsDialog
        open={settingsDialogOpen}
        autoPolling={autoPolling}
        reloadVehiclePositions={reloadVehiclePositions}
        setOpen={setSettingsDialogOpen}
        setAutoPolling={setAutoPolling}
      />
    </div>
  );
};
