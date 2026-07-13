import { useDataFromRouteLoader } from "app/Router";
import { useAtomValue } from "jotai";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { useVehiclePositions as useVehiclePositionsApi } from "shared/api/generated/api";
import { useCurrentRoute } from "shared/hooks/UseCurrentRoute";
import { searchParamsDataLoader } from "shared/loaders/searchParamsDataLoader";
import { isAutoPollingAtom } from "shared/state/atoms";
import { VehiclePosition } from "shared/types/interface.d";

// Stable empty array so consumers' memos don't recompute on every render
const NO_VEHICLES: VehiclePosition[] = [];

export const useVehiclePositions = () => {
  const autoPolling = useAtomValue(isAutoPollingAtom);
  const { currentRoute: route } = useCurrentRoute();

  const { directionId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const searchParamsData = useDataFromRouteLoader(
    "searchParams",
    searchParamsDataLoader
  );

  // Only enable query when on a route or stop page
  const isOnRoutePage = location.pathname.startsWith("/route/");
  const isOnStopPage = location.pathname.startsWith("/stop/");
  const shouldShowVehicles = isOnRoutePage || isOnStopPage;

  const { data: vehiclePositionsData } = useVehiclePositionsApi(
    {
      // Placeholder to satisfy the required param; the query stays
      // disabled until a route is selected.
      route_id: route?.routeId || "1",
      direction: Number(
        directionId !== undefined
          ? directionId
          : searchParams.get("directionId")
      ),
    },
    {
      query: {
        enabled: route !== undefined && shouldShowVehicles,
        refetchInterval: autoPolling ? 15000 : false,
      },
    }
  );

  const vehiclePositions: VehiclePosition[] = shouldShowVehicles
    ? searchParamsData?.vehiclePositions ||
      (vehiclePositionsData as VehiclePosition[] | undefined) ||
      NO_VEHICLES
    : NO_VEHICLES;

  return { vehiclePositions };
};
