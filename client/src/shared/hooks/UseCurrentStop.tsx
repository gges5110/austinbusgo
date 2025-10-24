import { useDataFromRouteLoader } from "app/Router";
import { stopLoader } from "features/stop/pages/stop/StopLoader";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecentSearches } from "shared/hooks/UseRecentSearches";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { currentStopAtom } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

export const useCurrentStop = () => {
  const [currentStop, setCurrentStop] = useAtom(currentStopAtom);
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();
  const { addToRecentSearches } = useRecentSearches();
  const { routeId, directionId } = useParams();

  // Derive stop from loaders
  const stopData = useDataFromRouteLoader("stop", stopLoader);
  const stop = stopData?.stop;

  // Sync derived stop with atom
  useEffect(() => {
    setCurrentStop(stop);
  }, [stop, setCurrentStop]);

  const setStop = (stop: Stop) => {
    const { stopId } = stop;

    if (stopId !== undefined) {
      addToRecentSearches(stop);
      setCurrentStop(stop);
      if (location.pathname.includes("/route")) {
        navigate(
          `${viewStatePathname}/stop/${stopId}?routeId=${routeId}&directionId=${directionId}`
        );
      } else {
        navigate(`${viewStatePathname}/stop/${stopId}`);
      }
    }
  };

  return {
    currentStop,
    setStop,
  };
};
