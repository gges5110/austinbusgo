import { useQueryClient } from "@tanstack/react-query";
import { useDataFromRouteLoader } from "app/Router";
import { routeLoader } from "features/route/pages/route/RouteLoader";
import { searchLoader } from "features/search/pages/search/SearchLoader";
import { isResponse } from "features/search/pages/search/SearchResultsMenu";
import { stopLoader } from "features/stop/pages/stop/StopLoader";
import { useAtomValue } from "jotai";
import { SnackbarKey, useSnackbar } from "notistack";
import { searchParamsDataLoader } from "pages/SearchParamsDataLoader";
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useVehiclePositionsQuery } from "shared/api/schemas/VehiclePositions.generated";
import { isAutoPollingAtom } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

export const useDataFromLoaders = () => {
  const autoPolling = useAtomValue(isAutoPollingAtom);

  const { routeId, directionId } = useParams();
  const [searchParams] = useSearchParams();

  const routeData = useDataFromRouteLoader("route", routeLoader);
  const searchParamsData = useDataFromRouteLoader(
    "searchParams",
    searchParamsDataLoader
  );
  const searchData = useDataFromRouteLoader("search", searchLoader);

  const route = searchParamsData?.route || routeData?.route;

  const [
    vehiclePositionsLoadingSnackbarKey,
    setVehiclePositionsLoadingSnackbarKey,
  ] = useState<SnackbarKey | undefined>(undefined);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { data: vehiclePositionsData } = useVehiclePositionsQuery(
    {
      routeId: route?.routeId || "1",
      direction: Number(
        directionId !== undefined
          ? directionId
          : searchParams.get("directionId")
      ),
    },
    {
      enabled: route !== undefined,
      refetchInterval: autoPolling ? 15000 : false,
      onSuccess: (vehiclePositions) => {
        if (vehiclePositions) {
          if (vehiclePositionsLoadingSnackbarKey) {
            closeSnackbar(vehiclePositionsLoadingSnackbarKey);
            setVehiclePositionsLoadingSnackbarKey(undefined);
          }
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
  const routeStops = searchParamsData?.stops || routeData?.stops || [];
  const searchStops =
    searchData !== undefined && !isResponse(searchData)
      ? searchData?.search.stops
      : [];
  const stopstop = stop !== undefined ? [stop] : [];
  const stops = [...routeStops, ...searchStops, ...stopstop] as Stop[];
  const routeShapes = searchParamsData?.shapes || routeData?.shapes || [];
  const vehiclePositions =
    searchParamsData?.vehiclePositions ||
    vehiclePositionsData?.vehiclePositions ||
    [];

  return {
    reloadVehiclePositions,
    stop,
    stops,
    route,
    routeShapes,
    vehiclePositions,
  };
};
