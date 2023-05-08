import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  createFilterOptions,
  debounce,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Route, Stop } from "../../interfaces/interface.d";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate, useNavigation } from "react-router-dom";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";
import { Highlight } from "./Highlight/Highlight";
import { useRecentSearches } from "../../hooks/UseRecentSearches";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RouteIcon from "@mui/icons-material/Route";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { useSearchLazyQuery } from "../../schemas/Search.generated";

export const SEARCH_PANEL_WIDTH = "392px";

enum SearchType {
  "recent",
  "search",
}

export interface SearchTerm {
  value: string;
}

export type OptionValue = Stop | Route | SearchTerm;

export interface SearchOption {
  type: SearchType;
  optionValue: OptionValue;
}

export const isRoute = (option: OptionValue): option is Route => {
  if (!("__typename" in option)) {
    return false;
  }

  return option.__typename === "Route";
};

export const isStop = (option: OptionValue): option is Stop => {
  if (!("__typename" in option)) {
    return false;
  }

  return option.__typename === "Stop";
};

export const isSearchTerm = (option: OptionValue): option is SearchTerm => {
  return "value" in option;
};

export interface SearchPanelProps {
  route?: Route;
  stop?: Stop;

  setRoute(route?: Route): void;

  setStop(stop?: Stop): void;

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
  const [stops, setStops] = useState<Stop[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    if (isBasePath) {
      setSearchPanelOpen(true);
    }
  }, [isBasePath]);

  useEffect(() => {
    if (searchTerm) {
      setInputString(searchTerm);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (stop) {
      const input = getStopOptionLabel(stop);
      setInputString(input);
      search(input);
      addToRecentSearches(stop);
    }
  }, [stop]);

  useEffect(() => {
    if (route) {
      const input = getRouteOptionLabel(route);
      setInputString(input);
      search(input);
      addToRecentSearches(route);
    }
  }, [route]);

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
        }
      } else if (isStop(optionValue)) {
        setStop(optionValue);
      }

      addToRecentSearches(optionValue);
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

  // TODO: fix onCompleted isn't fired when fetching from cached values
  // https://github.com/apollographql/react-apollo/issues/2177
  const [doSearch, { loading }] = useSearchLazyQuery({
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (data.search) {
        setStops(data.search.stops);
        setRoutes(data.search.routes);
      }
    },
  });

  const search = (value: string): void => {
    doSearch({
      variables: {
        searchTerm: value,
      },
    });
  };

  const goToSearchPage = () => {
    ref?.current?.blur?.();
    addToRecentSearches({
      value: inputString.trim(),
    });
    navigate(`${viewStatePathname}/search/${encodeURIComponent(inputString)}`);
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

  const options =
    inputString === ""
      ? recentSearches.map((search) => ({
          type: SearchType.recent,
          optionValue: search,
        }))
      : [
          ...stops.map((stop) => ({
            type: SearchType.search,
            optionValue: stop,
          })),
          ...routes.map((route) => ({
            type: SearchType.search,
            optionValue: route,
          })),
        ];

  return (
    <Paper
      sx={{
        m: 1,
        borderRadius: searchPanelOpen ? "10px 10px 0 0" : "10px",
        boxShadow: searchPanelOpen ? 1 : 5,
      }}
    >
      <Autocomplete<SearchOption>
        loading={loading}
        options={options}
        sx={{ width: SEARCH_PANEL_WIDTH }}
        value={value}
        blurOnSelect={true}
        open={searchPanelOpen}
        onClose={(event, reason) => {
          if (reason !== "toggleInput") {
            setSearchPanelOpen(false);
          }
        }}
        onBlur={() => {
          setSearchPanelOpen(false);
        }}
        onFocus={() => {
          setSearchPanelOpen(true);
        }}
        onOpen={() => {
          setSearchPanelOpen(true);
        }}
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
        inputValue={inputString}
        onInputChange={handleInputValueChange}
        openOnFocus={true}
        selectOnFocus={true}
        onChange={searchOnChange}
        filterOptions={filterOptions}
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
        renderOption={(props, option, { inputValue }) => {
          const { optionValue } = option;

          return (
            <li {...props}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Box sx={{ pr: 2, display: "flex", alignItems: "center" }}>
                  {option.type === SearchType.recent ? (
                    <AccessTimeOutlinedIcon
                      color={"neutral"}
                      sx={{ fontSize: 20 }}
                    />
                  ) : isRoute(optionValue) ? (
                    <RouteIcon color={"neutral"} sx={{ fontSize: 20 }} />
                  ) : (
                    <PlaceOutlinedIcon
                      color={"neutral"}
                      sx={{ fontSize: 20 }}
                    />
                  )}
                </Box>
                {isRoute(optionValue) && (
                  <>
                    <Highlight
                      text={String(optionValue.routeId)}
                      query={inputValue}
                    />
                    <Highlight
                      text={optionValue.routeLongName}
                      query={inputValue}
                    />
                  </>
                )}
                {isStop(optionValue) && (
                  <>
                    <Highlight
                      text={String(optionValue.stopId)}
                      query={inputValue}
                    />
                    <Highlight
                      text={String(optionValue.stopName || "")}
                      query={inputValue}
                    />
                  </>
                )}
                {isSearchTerm(optionValue) && (
                  <Highlight
                    text={String(optionValue.value)}
                    query={inputValue}
                  />
                )}
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <InputBase
            placeholder={"Search Routes or Stops"}
            ref={params.InputProps.ref}
            inputRef={ref}
            inputProps={params.inputProps}
            endAdornment={
              <>
                <Tooltip title="Search" placement="bottom-end">
                  <IconButton
                    sx={{
                      "&:hover": {
                        color: "#2196f3",
                        backgroundColor: "unset",
                      },
                      padding: "12px 15px",
                    }}
                    onClick={() => {
                      if (inputString !== "") {
                        goToSearchPage();
                      }
                    }}
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
                <Divider style={{ height: 28 }} orientation="vertical" />

                {inputString === "" ? (
                  <Box component={"div"} sx={{ padding: "10px 10px" }}>
                    <Tooltip title="Start search" placement="bottom-end">
                      <Button
                        variant="outlined"
                        color={"neutral"}
                        size="small"
                        onClick={() => {
                          focusAutocomplete();
                        }}
                        sx={{
                          width: 34,
                          height: 28,
                          minWidth: "unset",
                          borderRadius: "7px",
                          "&:hover": {
                            color: "#2196f3",
                          },
                        }}
                      >
                        <div>⌘K</div>
                      </Button>
                    </Tooltip>
                  </Box>
                ) : loading || routeLoading ? (
                  <Box sx={{ padding: "9px 15px" }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Tooltip title="Clear search" placement="bottom-end">
                    <IconButton
                      sx={{
                        "&:hover": {
                          color: "#2196f3",
                          backgroundColor: "unset",
                        },
                        padding: "12px 15px",
                      }}
                      onClick={clearSelection}
                    >
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            }
            sx={{
              paddingLeft: 2.5,
              flex: 1,
              width: "100%",
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                ref?.current?.blur?.();
              }
              if (event.key === "Enter") {
                goToSearchPage();
              }
            }}
          />
        )}
      />
    </Paper>
  );
};

const filterOptions = createFilterOptions<SearchOption>({
  limit: 5,
});
