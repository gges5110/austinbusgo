import { useEffect } from "react";
import { Route, Stop } from "shared/types/interface.d";

import {
  getRouteOptionLabel,
  getStopOptionLabel,
  SearchOption,
  SearchType,
} from "./searchPanelUtils";

interface UseSearchSyncParams {
  route?: Route;
  stop?: Stop;
  searchTerm?: string;
  setInputString: (value: string) => void;
  setValue: (value: SearchOption | null) => void;
  onOpenChange: (open: boolean) => void;
  search: (value: string) => void;
}

/**
 * Hook to synchronize internal search state with URL parameters.
 * When route, stop, or searchTerm changes from the URL, this hook updates
 * the input string, selected value, and panel open state accordingly.
 */
export const useSearchSync = ({
  route,
  stop,
  searchTerm,
  setInputString,
  setValue,
  onOpenChange,
  search,
}: UseSearchSyncParams) => {
  useEffect(() => {
    if (searchTerm) {
      setInputString(searchTerm);
      setValue({
        type: SearchType.recent,
        optionValue: {
          value: searchTerm,
        },
      });
      onOpenChange(false);
    } else if (stop) {
      const input = getStopOptionLabel(stop);
      setInputString(input);
      setValue({
        type: SearchType.recent,
        optionValue: stop,
      });
      search(input);
      onOpenChange(false);
    } else if (route) {
      const input = getRouteOptionLabel(route);
      setInputString(input);
      setValue({
        type: SearchType.recent,
        optionValue: route,
      });
      search(input);
      onOpenChange(false);
    } else {
      setInputString("");
    }
    // setInputString and search are memoized in useSearchInput, so they're stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, stop, route]);
};
