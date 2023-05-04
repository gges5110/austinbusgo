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
import ClearIcon from "@mui/icons-material/Clear";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Stop } from "../interfaces/interface.d";
import { useHotkeys } from "react-hotkeys-hook";
import parse from "autosuggest-highlight/parse";
import match from "autosuggest-highlight/match";
import { SearchModeToggle } from "./SearchModeToggle/SearchModeToggle";
import { useLocation, useNavigate } from "react-router-dom";
import { useStopsByNameLazyQuery } from "../schemas/StopsByName.generated";
import { useViewStatePathname } from "../hooks/UseViewStatePathname";
import { useAtom } from "jotai";
import { recentStopsAtom } from "../Atoms";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

const StyledPopper: React.FunctionComponent<PopperProps> = (props) => (
  <Popper
    {...props}
    style={{
      width: 408,
      paddingTop: 20,
    }}
    placement="bottom-start"
  />
);

interface StopOption extends Stop {
  type: "recent" | "search";
}

export interface SearchPanelProps {
  stops: Stop[];
  stop?: Stop;

  setStop(stop?: Stop): void;
}

const useRecentStops = () => {
  const [recentStops, setRecentStops] = useAtom(recentStopsAtom);

  const addToRecentStops = (stop: Stop): void => {
    const newValueInRecentSearchStops = recentStops.some((stop) => {
      return stop.stopId === stop.stopId;
    });
    if (!newValueInRecentSearchStops) {
      setRecentStops((prev) => {
        return [...prev, stop];
      });
    }
  };

  return {
    recentStops,
    addToRecentStops,
  };
};

export const StopsSearchPanel: React.FunctionComponent<SearchPanelProps> = ({
  stop,
  setStop,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [inputString, setInputString] = useState<string>("");

  const [searchPanelOpen, setSearchPanelOpen] = useState<boolean>(
    location.pathname === "/stops"
  );
  useEffect(() => {
    if (stop) {
      setInputString(getOptionLabel(stop));
      addToRecentStops(stop);
    }
  }, [stop]);

  useEffect(() => {
    if (location.pathname === "/stops") {
      setSearchPanelOpen(true);
      focusAutocomplete();
    }
  }, [location.pathname]);

  const { recentStops, addToRecentStops } = useRecentStops();

  const searchRouteOnChange = (
    event: React.SyntheticEvent,
    newValue: Stop | null
  ) => {
    if (newValue != null) {
      if (stop?.stopId !== newValue.stopId) {
        setStop(newValue);
        addToRecentStops(newValue);
      }
    } else {
      setStop(undefined);
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

  const [stops, setStops] = useState<Stop[]>([]);
  const { viewStatePathname } = useViewStatePathname();

  const clearSelection = () => {
    if (location.pathname !== "/stops") {
      navigate(`${viewStatePathname}/stops`);
      setSearchPanelOpen(true);
    }
    setInputString("");
    setStops([]);
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

  const delayedQuery = useCallback(
    debounce((value: string) => {
      if (value !== "") {
        getStopsByName({
          variables: {
            stopName: value,
          },
        });
      } else {
        setStops([]);
      }
    }, 500),
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

  const getOptionLabel = (stop: Stop) => {
    return `${stop.stopId} ${stop.stopName}`;
  };

  return (
    <Paper
      sx={{
        ml: 4,
        mt: 2,
        display: "flex",
        alignItems: "center",
        width: "fit-content",
        borderRadius: "10px",
      }}
    >
      <Autocomplete
        options={
          [
            ...stops.map((stop) => {
              return { ...stop, type: "search" } as StopOption;
            }),
            ...recentStops.map((stop) => {
              return { ...stop, type: "recent" } as StopOption;
            }),
          ] || []
        }
        sx={{ width: "300px" }}
        value={stop || null}
        inputValue={inputString}
        blurOnSelect={true}
        autoComplete={true}
        open={searchPanelOpen}
        onClose={(event, reason) => {
          if (reason !== "toggleInput") {
            setSearchPanelOpen(false);
          }
        }}
        onFocus={() => {
          setSearchPanelOpen(true);
        }}
        onClick={() => {
          setSearchPanelOpen(true);
        }}
        componentsProps={{
          paper: {
            sx: {
              borderRadius: "10px",
            },
          },
        }}
        PopperComponent={StyledPopper}
        autoHighlight={true}
        openOnFocus={true}
        selectOnFocus={true}
        onChange={searchRouteOnChange}
        onInputChange={handleInputValueChange}
        isOptionEqualToValue={(option, value) => {
          return option.stopId === value.stopId;
        }}
        getOptionLabel={getOptionLabel}
        ListboxProps={{ style: { maxHeight: "60vh" } }}
        renderOption={(props, option, { inputValue }) => {
          const stopOption = option as StopOption;
          const stopNameMatches = match(stopOption.stopName || "", inputValue, {
            insideWords: true,
          });
          const stopNameParts = parse(
            stopOption.stopName || "",
            stopNameMatches
          );

          const routeIdMatches = match(String(stopOption.stopId), inputValue, {
            insideWords: true,
          });
          const routeIdParts = parse(String(stopOption.stopId), routeIdMatches);

          return (
            <li {...props}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Box>
                  {stopOption.type === "recent" ? (
                    <AccessTimeOutlinedIcon />
                  ) : (
                    <PlaceOutlinedIcon />
                  )}
                </Box>
                <Box
                  component="span"
                  sx={{
                    minWidth: "30px",
                    display: "inline-block",
                  }}
                >
                  {routeIdParts.map((part, index) => (
                    <span
                      key={index}
                      style={{
                        fontWeight: part.highlight ? 700 : 400,
                      }}
                    >
                      {part.text}
                    </span>
                  ))}
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontWeight: "bold",
                  }}
                >
                  {stopNameParts.map((part, index) => (
                    <span
                      key={index}
                      style={{
                        fontWeight: part.highlight ? 700 : 400,
                      }}
                    >
                      {part.text}
                    </span>
                  ))}
                </Box>
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <InputBase
            placeholder={"Search Stops by code or name"}
            ref={params.InputProps.ref}
            inputRef={ref}
            inputProps={params.inputProps}
            sx={{
              paddingLeft: 2.5,
              paddingRight: 3,
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

      <Box component={"div"} sx={{ p: 1.5 }}>
        <Tooltip title="Start search" placement="bottom-end">
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              focusAutocomplete();
            }}
            sx={{
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
      <Divider style={{ height: 28 }} orientation="vertical" />
      {inputString === "" ? (
        <SearchModeToggle />
      ) : loading ? (
        <Box sx={{ p: 0.5, px: 1 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Tooltip title="Clear search" placement="bottom-end">
          <IconButton
            sx={{
              "&:hover": {
                color: "#2196f3",
              },
            }}
            onClick={clearSelection}
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>
      )}
    </Paper>
  );
};
