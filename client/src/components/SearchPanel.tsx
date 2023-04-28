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
import { useCallback, useRef, useState } from "react";
import { Route } from "../interfaces/interface.d";
import { useHotkeys } from "react-hotkeys-hook";
import { useAtomValue } from "jotai";
import { searchModeAtom } from "../Atoms";
import parse from "autosuggest-highlight/parse";
import match from "autosuggest-highlight/match";
import {
  SearchMode,
  SearchModeToggle,
} from "./SearchModeToggle/SearchModeToggle";

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
  readonly routes: Route[];
  readonly loading?: boolean;
  readonly routeLoading?: boolean;
  readonly route?: Route;
  setRoute(trip?: Route): void;
}

export const SearchPanel: React.FunctionComponent<SearchPanelProps> = ({
  routes,
  loading,
  routeLoading,
  route,
  setRoute,
}) => {
  const searchMode = useAtomValue(searchModeAtom);
  const [searchPanelOpen, setSearchPanelOpen] = useState<boolean>(true);

  const searchRouteOnChange = (
    // eslint-disable-next-line @typescript-eslint/ban-types
    event: React.ChangeEvent<{}>,
    newValue: Route | null
  ) => {
    if (newValue != null) {
      if (route?.routeId !== newValue.routeId) {
        setRoute(newValue);
      }
    } else {
      setRoute(undefined);
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

  const clearSelection = () => {
    setRoute(undefined);
  };

  const delayedQuery = useCallback(debounce(searchRouteOnChange, 500), []);

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
      {searchMode == SearchMode.Route && (
        <Autocomplete
          options={routes || []}
          loading={loading}
          sx={{ width: "300px" }}
          value={route || null}
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
                borderRadius: "10px",
              },
            },
          }}
          PopperComponent={StyledPopper}
          autoHighlight={true}
          openOnFocus={true}
          selectOnFocus={true}
          onHighlightChange={(event, option, reason) => {
            if (reason === "keyboard") {
              delayedQuery(event, option);
            }
          }}
          onChange={searchRouteOnChange}
          isOptionEqualToValue={(option, value) => {
            return option.routeId === value.routeId;
          }}
          getOptionLabel={(option) =>
            `${option.routeId} ${option.routeLongName}`
          }
          ListboxProps={{ style: { maxHeight: "60vh" } }}
          renderOption={(props, option, { inputValue }) => {
            const routeLongNameMatches = match(
              option.routeLongName,
              inputValue,
              {
                insideWords: true,
              }
            );
            const routeLongNameParts = parse(
              option.routeLongName,
              routeLongNameMatches
            );

            const routeIdMatches = match(String(option.routeId), inputValue, {
              insideWords: true,
            });
            const routeIdParts = parse(String(option.routeId), routeIdMatches);

            return (
              <li {...props}>
                <Box
                  component="span"
                  sx={{
                    width: "30px",
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
              </li>
            );
          }}
          renderInput={(params) => (
            <InputBase
              placeholder={"Search Routes"}
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
      )}
      {searchMode == SearchMode.Stop && <div>Stop Search</div>}

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
      {route === undefined ? (
        <SearchModeToggle />
      ) : routeLoading ? (
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
