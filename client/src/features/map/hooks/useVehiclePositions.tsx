import { useDataFromRouteLoader } from "app/Router";
import { useAtomValue } from "jotai";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { searchParamsDataLoader } from "shared/loaders/searchParamsDataLoader";
import { useVehiclePositionsQuery } from "shared/api/schemas/VehiclePositions.generated";
import { useCurrentRoute } from "shared/hooks/UseCurrentRoute";
import { isAutoPollingAtom } from "shared/state/atoms";
import { VehiclePosition } from "shared/types/interface.d";

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
      enabled: route !== undefined && shouldShowVehicles,
      refetchInterval: autoPolling ? 15000 : false,
    }
  );

  if (!shouldShowVehicles) {
    return {
      vehiclePositions: [],
    };
  }

  const vehiclePositions: VehiclePosition[] =
    searchParamsData?.vehiclePositions ||
    vehiclePositionsData?.vehiclePositions ||
    [];

  return { vehiclePositions };
};
