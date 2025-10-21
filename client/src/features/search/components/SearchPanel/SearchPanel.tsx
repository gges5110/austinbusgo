import { Autocomplete, createFilterOptions, debounce } from "@mui/material";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Route, Stop } from "../../../../shared/types/interface.d";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useNavigation } from "react-router-dom";
import { useViewStatePathname } from "../../../../shared/hooks/UseViewStatePathname";
import { useRecentSearches } from "../../../../shared/hooks/UseRecentSearches";
import {
  SearchQuery,
  useSearchQuery,
} from "../../../../shared/api/schemas/Search.generated";
import { InputEndAdornment } from "./InputEndAdornment/InputEndAdornment";
import { renderOption } from "./RenderOption";

export const SEARCH_PANEL_WIDTH = "392px";

export enum SearchType {
  "recent",
  "search",
}

export interface SearchTerm {
  value: string;
}

type ArrayElement<
  ArrayType extends readonly unknown[]
> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type OptionValue =
  | ArrayElement<SearchQuery["search"]["stops"]>
  | Route
  | SearchTerm;

export interface SearchOption {
  type: SearchType;
  optionValue: OptionValue;
}

export const isRoute = (option: OptionValue): option is Route => {
  return "routeLongName" in option;
};

export const isStop = (option: OptionValue): option is Stop => {
  return "stopName" in option;
};

export const isSearchTerm = (option: OptionValue): option is SearchTerm => {
  return "value" in option;
};

export interface SearchPanelProps {
  route?: Route;
  stop?: Stop;

  setRoute(route: Route): void;

  setStop(stop: Stop): void;

  searchTerm?: string;
}

export const SearchPanel: React.FunctionComponent<SearchPanelProps> = ({
  searchTerm,
  route,
  setRoute,
  stop,
  setStop,
}) => {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { viewStatePathname, isBasePath } = useViewStatePathname();

  const routeLoading = navigation.location !== undefined;

  const [searchPanelOpen, setSearchPanelOpen] = useState<boolean>(false);
  const [value, setValue] = useState<SearchOption | null>(null);
  const [inputString, setInputString] = useState<string>("");
  const [stops, setStops] = useState<SearchQuery["search"]["stops"]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [options, setOptions] = useState<SearchOption[]>([]);

  useEffect(() => {
    if (isBasePath) {
      setSearchPanelOpen(true);
    }
  }, [isBasePath]);

  useEffect(() => {
    if (searchTerm) {
      setInputString(searchTerm);
      setValue({
        type: SearchType.recent,
        optionValue: {
          value: searchTerm,
        },
      });
      setSearchPanelOpen(false);
    } else if (stop) {
      const input = getStopOptionLabel(stop);
      setInputString(input);
      setValue({
        type: SearchType.recent,
        optionValue: stop,
      });
      search(input);
      setSearchPanelOpen(false);
    } else if (route) {
      const input = getRouteOptionLabel(route);
      setInputString(input);
      setValue({
        type: SearchType.recent,
        optionValue: route,
      });
      search(input);
      setSearchPanelOpen(false);
    } else {
      setInputString("");
    }
  }, [searchTerm, stop, route]);

  const searchOnChange = (
    event: React.SyntheticEvent,
    newValue: SearchOption | null
  ) => {
    setValue(newValue);
    if (newValue != null) {
      const { optionValue } = newValue;
      if (isRoute(optionValue)) {
        if (route?.routeId !== optionValue.routeId) {
          setRoute(optionValue);
          addToRecentSearches(optionValue);
        }
      } else if (isStop(optionValue)) {
        setStop(optionValue);
        addToRecentSearches(optionValue);
      } else if (isSearchTerm(optionValue)) {
        goToSearchPage(optionValue);
      }
    }
  };
  const ref = useRef<HTMLInputElement | null>(null);

  const focusAutocomplete = () => {
    ref?.current?.focus?.();
  };

  useHotkeys(
    "ctrl+k",
    () => {
      focusAutocomplete();
    },
    []
  );

  const handleInputValueChange = (
    event: React.SyntheticEvent,
    value: string
  ) => {
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
  };

  const clearSelection = () => {
    navigate(viewStatePathname);
    setInputString("");
    setValue(null);
    setSearchPanelOpen(true);
  };

  const getRouteOptionLabel = (route: Route) => {
    return `${route.routeId} ${route.routeLongName}`;
  };

  const getStopOptionLabel = (stop: Stop) => {
    return `${stop.stopId} ${stop.stopName}`;
  };

  const [internalSearchTerm, setInternalSearchTerm] = useState<string>("");

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

  const search = (value: string): void => {
    setInternalSearchTerm(value);
  };

  const goToSearchPage = (searchTerm?: SearchTerm) => {
    ref?.current?.blur?.();
    const value = searchTerm?.value || inputString.trim();
    navigate(`${viewStatePathname}/search/${encodeURIComponent(value)}`);
  };

  const delayedQuery = useCallback(
    debounce((value: string) => {
      if (value !== "") {
        search(value);
      } else {
        setStops([]);
      }
    }, 500),
    []
  );

  const { recentSearches, addToRecentSearches } = useRecentSearches();

  useEffect(() => {
    let options: SearchOption[];
    if (inputString === "") {
      options = recentSearches.map((search) => ({
        type: SearchType.recent,
        optionValue: search.value,
      }));
    } else {
      options = [
        ...stops.map((stop) => ({
          type: SearchType.search,
          optionValue: stop,
        })),
        ...routes.map((route) => ({
          type: SearchType.search,
          optionValue: route,
        })),
      ];

      if (value && options.length === 0) {
        options.push(value);
      }
    }

    setOptions(options);
  }, [inputString, stops, routes, value, recentSearches]);

  return (
    <Paper
      sx={{
        m: 1,
        borderRadius: searchPanelOpen ? "10px 10px 0 0" : "10px",
        boxShadow: searchPanelOpen ? 1 : 5,
      }}
    >
      <Autocomplete<SearchOption>
        blurOnSelect={true}
        componentsProps={{
          paper: {
            sx: {
              borderRadius: "0 0 10px 10px",
            },
          },
          popper: {
            sx: {
              width: SEARCH_PANEL_WIDTH,
              zIndex: 1,
            },
          },
        }}
        filterOptions={filterOptions}
        getOptionLabel={(option: SearchOption) => {
          const { optionValue } = option;
          if (isRoute(optionValue)) {
            return getRouteOptionLabel(optionValue);
          } else if (isStop(optionValue)) {
            return getStopOptionLabel(optionValue);
          } else if (isSearchTerm(optionValue)) {
            return optionValue.value;
          }

          return "";
        }}
        inputValue={inputString}
        isOptionEqualToValue={(option, value) => {
          const { optionValue } = option;

          if (isRoute(optionValue)) {
            return (
              isRoute(value.optionValue) &&
              optionValue.routeId === value.optionValue.routeId
            );
          } else if (isStop(optionValue)) {
            return (
              isStop(value.optionValue) &&
              optionValue.stopId === value.optionValue.stopId
            );
          } else if (isSearchTerm(optionValue)) {
            return (
              isSearchTerm(value.optionValue) &&
              optionValue.value === value.optionValue.value
            );
          }

          return false;
        }}
        loading={isLoading && internalSearchTerm !== ""}
        onBlur={() => {
          setSearchPanelOpen(false);
        }}
        onChange={searchOnChange}
        onClose={(event, reason) => {
          if (reason !== "toggleInput") {
            setSearchPanelOpen(false);
          }
        }}
        onFocus={() => {
          setSearchPanelOpen(true);
        }}
        onInputChange={handleInputValueChange}
        onOpen={() => {
          setSearchPanelOpen(true);
        }}
        open={searchPanelOpen}
        openOnFocus={true}
        options={options}
        renderInput={(params) => (
          <InputBase
            endAdornment={
              <InputEndAdornment
                clearSelection={clearSelection}
                focusAutocomplete={focusAutocomplete}
                goToSearchPage={goToSearchPage}
                inputString={inputString}
                loading={
                  (isLoading && internalSearchTerm !== "") || routeLoading
                }
              />
            }
            inputProps={params.inputProps}
            inputRef={ref}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                ref?.current?.blur?.();
              }
              if (event.key === "Enter") {
                goToSearchPage();
              }
            }}
            placeholder={"Search Routes or Stops"}
            ref={params.InputProps.ref}
            sx={{
              paddingLeft: 2.5,
              flex: 1,
              width: "100%",
            }}
          />
        )}
        renderOption={renderOption}
        selectOnFocus={true}
        sx={{ width: SEARCH_PANEL_WIDTH }}
        value={value}
      />
    </Paper>
  );
};

const filterOptions = createFilterOptions<SearchOption>({
  limit: 5,
});
