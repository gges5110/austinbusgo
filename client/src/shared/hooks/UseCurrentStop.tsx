import { useDataFromRouteLoader } from "app/Router";
import { stopLoader } from "features/stop/pages/stop/StopLoader";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecentSearches } from "shared/hooks/UseRecentSearches";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { currentStopAtom, mapsFlyToCoordinateAtom } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

export const useCurrentStop = () => {
  const [currentStop, setCurrentStop] = useAtom(currentStopAtom);
  const setMapsFlyToCoordinate = useSetAtom(mapsFlyToCoordinateAtom);
  const navigate = useNavigate();
  const { viewStatePathname, withPreservedSearch } = useViewStatePathname();
  const { addToRecentSearches } = useRecentSearches();
  const { routeId, directionId } = useParams();

  // Derive stop from loaders
  const stop = useDataFromRouteLoader("stop", stopLoader);

  // Sync the stop page's loader stop into the atom, but only when it
  // changes (opening or leaving a stop page). Syncing on mount would clear a
  // stop another page published (Nearby does) whenever a component using
  // this hook mounts later, e.g. the lazily loaded map.
  const syncedStop = useRef<Stop | undefined>(undefined);
  useEffect(() => {
    if (stop === syncedStop.current) return;
    syncedStop.current = stop;
    setCurrentStop(stop);
  }, [stop, setCurrentStop]);

  const setStop = (stop: Stop) => {
    const { stopId } = stop;

    if (stopId !== undefined) {
      addToRecentSearches(stop);
      setCurrentStop(stop);
      if (stop.stopLoc?.coordinates) {
        setMapsFlyToCoordinate([
          stop.stopLoc.coordinates[0],
          stop.stopLoc.coordinates[1],
        ]);
      }
      if (location.pathname.includes("/route") && routeId && directionId) {
        navigate(
          `/stop/${stopId}${viewStatePathname}${withPreservedSearch({ routeId, directionId })}`
        );
      } else {
        navigate(`/stop/${stopId}${viewStatePathname}${withPreservedSearch()}`);
      }
    }
  };

  return {
    currentStop,
    setStop,
  };
};
