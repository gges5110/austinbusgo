import { debounce } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { useSearch } from "shared/api/generated/api";
import { Route } from "shared/types/interface.d";

export const useSearchInput = () => {
  const [inputString, setInputString] = useState<string>("");
  const [internalSearchTerm, setInternalSearchTerm] = useState<string>("");

  const { data, isLoading } = useSearch(
    {
      q: internalSearchTerm,
    },
    {
      query: {
        enabled: internalSearchTerm !== "",
        // Show the previous results while the next search loads instead of
        // flashing an empty option list on every keystroke
        keepPreviousData: true,
      },
    }
  );

  const stops = data?.stops ?? [];
  const routes: Route[] = (data?.routes as Route[]) ?? [];

  const search = useCallback((value: string): void => {
    setInternalSearchTerm(value);
  }, []);

  // Short debounce: repeated terms are edge-cached, so re-queries are cheap
  const delayedSearch = useMemo(() => debounce(search, 300), [search]);

  const handleInputValueChange = useCallback(
    (event: React.SyntheticEvent, value: string) => {
      if (!event || event.type === "blur") {
        return;
      }
      setInputString(value);

      if (event.type === "change") {
        delayedSearch(value);
      }
    },
    [delayedSearch]
  );

  return {
    inputString,
    setInputString,
    stops,
    routes,
    // A disabled query still reports isLoading until it has data
    isLoading: isLoading && internalSearchTerm !== "",
    handleInputValueChange,
    search,
  };
};
