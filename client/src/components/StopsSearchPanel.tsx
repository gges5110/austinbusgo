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

export interface SearchPanelProps {
  stops: Stop[];
  stop?: Stop;
  setStop(stop?: Stop): void;
  searchString: string;
}

export const StopsSearchPanel: React.FunctionComponent<SearchPanelProps> = ({
  // stops,
  stop,
  setStop,
  searchString,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [inputString, setInputString] = useState<string>("");

  const [searchPanelOpen, setSearchPanelOpen] = useState<boolean>(
    location.pathname === "/stops"
  );

  useEffect(() => {
    if (location.pathname === "/stops") {
      setSearchPanelOpen(true);
      focusAutocomplete();
    }
  }, [location.pathname]);

  const searchRouteOnChange = (
    event: React.SyntheticEvent,
    newValue: Stop | null
  ) => {
    if (newValue != null) {
      if (stop?.stopId !== newValue.stopId) {
        setStop(newValue);
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

  const clearSelection = () => {
    if (location.pathname !== "/stops") {
      navigate("/@30.3116707,-97.7385137,12.89z/stops");
      setSearchPanelOpen(true);
    }
    setInputString("");
    setStops([]);
  };

  const [getStopsByName, { loading }] = useStopsByNameLazyQuery({
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
        options={stops || []}
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
        getOptionLabel={(option) => `${option.stopId} ${option.stopName}`}
        ListboxProps={{ style: { maxHeight: "60vh" } }}
        renderOption={(props, option, { inputValue }) => {
          const routeLongNameMatches = match(
            option.stopName || "",
            inputValue,
            {
              insideWords: true,
            }
          );
          const routeLongNameParts = parse(
            option.stopName || "",
            routeLongNameMatches
          );

          const routeIdMatches = match(String(option.stopId), inputValue, {
            insideWords: true,
          });
          const routeIdParts = parse(String(option.stopId), routeIdMatches);

          return (
            <li {...props}>
              <Box sx={{ display: "flex", gap: 1 }}>
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
                  {routeLongNameParts.map((part, index) => (
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
            color={"neutral"}
            size="small"
            onClick={() => {
              focusAutocomplete();
            }}
            sx={{
              minWidth: "unset",
              borderRadius: "7px",
              "&:hover": {
                backgroundColor: "#fff",
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
        <CircularProgress />
      ) : (
        <Tooltip title="Clear search" placement="bottom-end">
          <IconButton
            sx={{
              "&:hover": {
                backgroundColor: "#fff",
                color: "#2196f3",
              },
            }}
            color={"neutral"}
            onClick={clearSelection}
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>
      )}
    </Paper>
  );
};
