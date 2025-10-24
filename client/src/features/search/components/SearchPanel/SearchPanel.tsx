import MenuIcon from "@mui/icons-material/Menu";
import { Box, IconButton } from "@mui/material";
import Paper from "@mui/material/Paper";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router-dom";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { Route, Stop } from "shared/types/interface.d";

import {
  getRouteOptionLabel,
  getStopOptionLabel,
  SearchOption,
  SearchType,
} from "./hooks/searchPanelUtils";
import { useSearchInput } from "./hooks/useSearchInput";
import { useSearchNavigation } from "./hooks/useSearchNavigation";
import { useSearchOptions } from "./hooks/useSearchOptions";
import { SearchAutocomplete } from "./SearchAutocomplete";

export const SEARCH_PANEL_WIDTH = "392px";

export interface SearchPanelProps {
  route?: Route;
  stop?: Stop;

  setRoute(route: Route): void;

  setStop(stop: Stop): void;

  searchTerm?: string;

  onMenuClick(): void;
}

export const SearchPanel: React.FunctionComponent<SearchPanelProps> = ({
  searchTerm,
  route,
  setRoute,
  stop,
  setStop,
  onMenuClick,
}) => {
  const navigation = useNavigation();
  const { isBasePath } = useViewStatePathname();
  const ref = useRef<HTMLInputElement | null>(null);

  const routeLoading = navigation.location !== undefined;

  const [searchPanelOpen, setSearchPanelOpen] = useState<boolean>(false);
  const [value, setValue] = useState<SearchOption | null>(null);

  // Custom hooks for managing search state
  const {
    inputString,
    setInputString,
    stops,
    routes,
    isLoading,
    handleInputValueChange,
    search,
  } = useSearchInput();

  const { options, addToRecentSearches } = useSearchOptions({
    inputString,
    stops,
    routes,
    value,
  });

  const {
    handleSearchChange,
    goToSearchPage,
    clearSelection,
  } = useSearchNavigation({
    route,
    setRoute,
    setStop,
    addToRecentSearches,
    inputString,
    ref,
  });

  // Open search panel when on base path
  useEffect(() => {
    if (isBasePath) {
      setSearchPanelOpen(true);
    }
  }, [isBasePath]);

  // Sync input with URL parameters
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
    // setInputString and search are memoized in useSearchInput, so they're stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, stop, route]);

  // Handle selection changes
  const searchOnChange = (
    _event: React.SyntheticEvent,
    newValue: SearchOption | null
  ) => {
    setValue(newValue);
    handleSearchChange(_event, newValue);
  };

  // Clear selection and reset state
  const handleClearSelection = () => {
    clearSelection();
    setInputString("");
    setValue(null);
    setSearchPanelOpen(true);
  };

  return (
    <Paper
      sx={{
        m: 1,
        borderRadius: searchPanelOpen ? "16px 16px 0 0" : "24px",
        boxShadow: searchPanelOpen ? 1 : 5,
        width: SEARCH_PANEL_WIDTH,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
        <IconButton
          aria-label={"menu"}
          edge={"start"}
          onClick={onMenuClick}
          sx={{ ml: 1 }}
        >
          <MenuIcon />
        </IconButton>
        <SearchAutocomplete
          inputRef={ref}
          inputValue={inputString}
          loading={isLoading || routeLoading}
          onBlur={() => setSearchPanelOpen(false)}
          onChange={searchOnChange}
          onClearSelection={handleClearSelection}
          onClose={() => setSearchPanelOpen(false)}
          onEnterPress={goToSearchPage}
          onFocus={() => setSearchPanelOpen(true)}
          onInputChange={handleInputValueChange}
          onOpen={() => setSearchPanelOpen(true)}
          open={searchPanelOpen}
          options={options}
          value={value}
        />
      </Box>
    </Paper>
  );
};
