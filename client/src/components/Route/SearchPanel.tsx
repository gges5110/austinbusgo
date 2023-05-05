import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  debounce,
  Divider,
  IconButton,
  Popper,
  PopperProps,
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
import { Highlight } from "./Highlight";
import { useStopsByNameLazyQuery } from "../../schemas/StopsByName.generated";
import { useRecentSearches } from "../../hooks/UseRecentSearches";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RouteIcon from "@mui/icons-material/Route";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

export const SEARCH_PANEL_WIDTH = "392px";

const StyledPopper: React.FunctionComponent<PopperProps> = (props) => (
  <Popper
    {...props}
    style={{
      width: SEARCH_PANEL_WIDTH,
      paddingTop: 12,
    }}
    placement="bottom-start"
  />
);

enum SearchType {
  "recent",
  "search",
}

export interface SearchOption {
  type: SearchType;
  optionValue: Stop | Route;
}

export const isRoute = (option: Stop | Route): option is Route => {
  return option.__typename === "Route";
};

export const isStop = (option: Stop | Route): option is Stop => {
  return option.__typename === "Stop";
};

export interface SearchPanelProps {
  routes: Route[];
  route?: Route;
  stop?: Stop;

  setRoute(route?: Route): void;

  setStop(stop?: Stop): void;
}

export const SearchPanel: React.FunctionComponent<SearchPanelProps> = ({
  route,
  routes,
  setRoute,
  stop,
  setStop,
}) => {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { viewStatePathname, isBasePath } = useViewStatePathname();

  const routeLoading = navigation.location !== undefined;

  const [searchPanelOpen, setSearchPanelOpen] = useState<boolean>(false);
  const [inputString, setInputString] = useState<string>("");
  const [stops, setStops] = useState<Stop[]>([]);
  useEffect(() => {
    if (route) {
      setInputString(getRouteOptionLabel(route));
    }
  }, [route]);

  useEffect(() => {
    if (isBasePath) {
      setSearchPanelOpen(true);
    }
  }, [isBasePath]);

  useEffect(() => {
    if (stop) {
      setInputString(getStopOptionLabel(stop));
      addToRecentSearches(stop);
    }
  }, [stop]);

  const searchOnChange = (
    event: React.SyntheticEvent,
    newValue: SearchOption | null
  ) => {
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
  const [getStopsByName, { loading }] = useStopsByNameLazyQuery({
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (data.stopsByName) {
        setStops(data.stopsByName);
      }
    },
  });

  const search = (value: string): void => {
    getStopsByName({
      variables: {
        stopName: value,
      },
    });
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
  const options = [
    ...recentSearches.map((search) => ({
      type: SearchType.recent,
      optionValue: search,
    })),
    ...routes.map((route) => ({
      type: SearchType.search,
      optionValue: route,
    })),
    ...stops.map((stop) => ({
      type: SearchType.search,
      optionValue: stop,
    })),
  ];

  return (
    <Paper
      sx={{
        ml: 4,
        mt: 2,
        display: "flex",
        alignItems: "center",
        width: "fit-content",
        borderRadius: searchPanelOpen ? "10px 10px 0 0" : "10px",
        boxShadow: 2,
      }}
    >
      <Autocomplete<SearchOption>
        options={options}
        sx={{ width: SEARCH_PANEL_WIDTH }}
        blurOnSelect={true}
        autoComplete={true}
        open={searchPanelOpen}
        onClose={() => {
          setSearchPanelOpen(false);
        }}
        onFocus={() => {
          setSearchPanelOpen(true);
        }}
        componentsProps={{
          paper: {
            sx: {
              borderRadius: "0 0 10px 10px",
            },
          },
        }}
        inputValue={inputString}
        onInputChange={handleInputValueChange}
        PopperComponent={StyledPopper}
        autoHighlight={true}
        openOnFocus={true}
        selectOnFocus={true}
        onChange={searchOnChange}
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
          }

          return false;
        }}
        getOptionLabel={(option: SearchOption) => {
          const { optionValue } = option;
          if (isRoute(optionValue)) {
            return getRouteOptionLabel(optionValue);
          } else if (isStop(optionValue)) {
            return getStopOptionLabel(optionValue);
          }

          return "";
        }}
        ListboxProps={{ style: { maxHeight: "60vh" } }}
        renderOption={(props, option, { inputValue }) => {
          const { optionValue } = option;

          return (
            <li {...props}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Box sx={{ pr: 2 }}>
                  {option.type === SearchType.recent ? (
                    <AccessTimeOutlinedIcon color={"neutral"} />
                  ) : isRoute(optionValue) ? (
                    <RouteIcon color={"neutral"} />
                  ) : (
                    <PlaceOutlinedIcon color={"neutral"} />
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
            autoFocus={route === undefined}
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
                        search(inputString);
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
            }}
          />
        )}
      />
    </Paper>
  );
};
