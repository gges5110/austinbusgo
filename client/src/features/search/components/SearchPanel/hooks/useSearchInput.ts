import { debounce } from "@mui/material";
import { useCallback, useState } from "react";
import {
  SearchQuery,
  useSearchQuery,
} from "shared/api/schemas/Search.generated";
import { Route } from "shared/types/interface.d";

export const useSearchInput = () => {
  const [inputString, setInputString] = useState<string>("");
  const [internalSearchTerm, setInternalSearchTerm] = useState<string>("");
  const [stops, setStops] = useState<SearchQuery["search"]["stops"]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  const { isLoading } = useSearchQuery(
    {
      searchTerm: internalSearchTerm,
    },
    {
      enabled: internalSearchTerm !== "",
      onSuccess: (data) => {
        if (data.search) {
          setStops(data.search.stops);
          setRoutes(data.search.routes);
        }
      },
    }
  );

  const search = useCallback((value: string): void => {
    setInternalSearchTerm(value);
  }, []);

  const delayedQuery = useCallback(
    debounce((value: string) => {
      if (value !== "") {
        setInternalSearchTerm(value);
      } else {
        setStops([]);
      }
    }, 500),
    []
  );

  const handleInputValueChange = useCallback(
    (event: React.SyntheticEvent, value: string) => {
      if (!event) {
        return;
      }

      if (event.type === "blur") {
        return;
      }
      setInputString(value);

      if (event.type === "change") {
        delayedQuery(value);
      }
    },
    [delayedQuery]
  );

  return {
    inputString,
    setInputString,
    stops,
    routes,
    isLoading: isLoading && internalSearchTerm !== "",
    handleInputValueChange,
    search,
  };
};
