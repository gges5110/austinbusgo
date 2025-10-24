import { useDataFromRouteLoader } from "app/Router";
import { useAtomValue } from "jotai";
import { searchParamsDataLoader } from "pages/SearchParamsDataLoader";
import { useParams, useSearchParams } from "react-router-dom";
import { useVehiclePositionsQuery } from "shared/api/schemas/VehiclePositions.generated";
import { useCurrentRoute } from "shared/hooks/UseCurrentRoute";
import { isAutoPollingAtom } from "shared/state/atoms";
import { VehiclePosition } from "shared/types/interface.d";

export const useVehiclePositions = () => {
  const autoPolling = useAtomValue(isAutoPollingAtom);
  const { currentRoute: route } = useCurrentRoute();

  const { directionId } = useParams();
  const [searchParams] = useSearchParams();

  const searchParamsData = useDataFromRouteLoader(
    "searchParams",
    searchParamsDataLoader
  );

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
    }
  );

  const vehiclePositions: VehiclePosition[] =
    searchParamsData?.vehiclePositions ||
    vehiclePositionsData?.vehiclePositions ||
    [];

  return { vehiclePositions };
};
