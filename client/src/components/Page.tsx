import { IconButton } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import { SnackbarKey, useSnackbar } from "notistack";
import * as React from "react";
import { ReactNode, useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { RunningTrip } from "../interfaces/interface.d";
import { useTripsQuery } from "../schemas/Trips.generated";
import { useVehiclePositionsLazyQuery } from "../schemas/VehiclePositions.generated";
import { LoadingSnackbarMessage } from "./LoadingSnackbarMessage";
import { SettingsDialog } from "./SettingsDialog";
import { useNavigate, useParams } from "react-router-dom";
import { useStopsAndShapesLazyQuery } from "../schemas/StopsAndRouteShapes.generated";
import { getDate } from "./Map/Stop/StopDrawer";
import { useAtom } from "jotai";
import { selectedRouteAtom, settingsDialogOpenAtom } from "../Atoms";
import { useRouteLazyQuery } from "../schemas/Route.generated";
import { MapWrapper } from "./Map/MapWrapper";

const defaultAutoPollingInterval = 15000;

export const Page: React.FunctionComponent = () => {
  const [autoPolling, setAutoPolling] = useLocalStorage<boolean>(
    "vehiclePositionAutoPolling",
    false
  );
  const [settingsDialogOpen, setSettingsDialogOpen] = useAtom(
    settingsDialogOpenAtom
  );
  const [selectedTrip, setSelectedTrip] = useAtom(selectedRouteAtom);
  const [tripLoadingSnackbarKey, setTripLoadingSnackbarKey] = useState<
    SnackbarKey | undefined
  >(undefined);
  const { routeId, directionId, stopId } = useParams();
  const [getRoute] = useRouteLazyQuery({
    fetchPolicy: "network-only",
    onCompleted: (route) => {
      if (route) {
        setSelectedTrip({
          routeId: String(route.route.routeId),
          direction: Boolean(directionId),
          routeLongName: route.route.routeLongName || "",
          color: route.route.routeColor,
        });
      }
    },
  });
  console.log(routeId, directionId, stopId);
  useEffect(() => {
    if (routeId && directionId) {
      getRoute({
        variables: {
          routeId: routeId,
        },
      });

      getStopsAndShapes({
        variables: {
          routeId,
          directionId: Boolean(directionId),
          date: getDate(),
        },
      });

      getVehiclePositions({
        variables: {
          routeId: Number(routeId),
          direction: Boolean(directionId),
        },
      });
    }
  }, []);
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
    variables: {
      date: getDate(),
    },
  });

  const [
    getStopsAndShapes,
    { data: stopsAndShapes },
  ] = useStopsAndShapesLazyQuery({
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

  const navigate = useNavigate();

  const setTrip = (trip: RunningTrip | undefined): void => {
    setSelectedTrip(trip);
    if (trip !== undefined) {
      navigate(
        `/route/${trip.routeId}/direction/${trip.direction ? "1" : "0"}`
      );
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

      getStopsAndShapes({
        variables: {
          routeId: trip.routeId,
          directionId: trip.direction,
          date: getDate(),
        },
      });

      getVehiclePositions({
        variables: {
          routeId: Number(trip.routeId),
          direction: trip.direction,
        },
      });
    } else {
      navigate(`/`);
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
        runningTrips={tripsResponse?.trips || []}
        setTrip={setTrip}
        loading={loading}
        stops={(selectedTrip && stopsAndShapes?.stopsAndShapes.stops) || []}
        routeShapes={
          (selectedTrip && stopsAndShapes?.stopsAndShapes.shapes) || []
        }
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
