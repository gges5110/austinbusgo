import { Autocomplete, createFilterOptions } from "@mui/material";
import * as React from "react";
import { useRef, useState } from "react";
import { useLocation, useNavigation, useParams } from "react-router-dom";
import { useCurrentRoute } from "shared/hooks/UseCurrentRoute";
import { useCurrentStop } from "shared/hooks/UseCurrentStop";

import {
  getOptionLabel,
  isOptionEqualToValue,
  SearchOption,
} from "./hooks/searchPanelUtils";
import { useSearchInput } from "./hooks/useSearchInput";
import { useSearchNavigation } from "./hooks/useSearchNavigation";
import { useSearchOptions } from "./hooks/useSearchOptions";
import { useSearchSync } from "./hooks/useSearchSync";
import { renderOption } from "./RenderOption";
import { SearchInput } from "./SearchInput";
import { SEARCH_PANEL_WIDTH } from "./SearchPanel";

interface SearchAutocompleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const filterOptions = createFilterOptions<SearchOption>({
  limit: 8,
});

export const SearchAutocomplete: React.FunctionComponent<SearchAutocompleteProps> = ({
  open,
  onOpenChange,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState<SearchOption | null>(null);
  const { currentRoute } = useCurrentRoute();
  const { currentStop } = useCurrentStop();
  const { searchTerm } = useParams();
  const location = useLocation();

  const navigation = useNavigation();
  const externalLoading = navigation.location !== undefined;

  // Check if we're on the favorites or recent searches page
  const isOnFavoritesPage = location.pathname.startsWith("/favorites");
  const isOnRecentSearchesPage = location.pathname.startsWith(
    "/recent-searches"
  );

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

  const { options, removeFromRecentSearches } = useSearchOptions({
    inputString,
    stops,
    routes,
    value,
  });

  const { handleSelect, handleClear, handleSearch } = useSearchNavigation();

  // Sync input with URL parameters
  useSearchSync({
    route: currentRoute,
    stop: currentStop,
    searchTerm,
    setInputString,
    setValue,
    onOpenChange,
    search,
    isOnFavoritesPage,
    isOnRecentSearchesPage,
  });

  // Handle selection changes
  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: SearchOption | null
  ) => {
    setValue(newValue);
    if (newValue) {
      handleSelect(newValue);
    }
  };

  // Clear selection and reset state
  const handleClearSelection = () => {
    // If on favorites or recent searches page, navigate to base path
    if (isOnFavoritesPage || isOnRecentSearchesPage) {
      handleClear();
    } else {
      handleClear();
      setInputString("");
      setValue(null);
      onOpenChange(true);
    }
  };

  // Handle search page navigation
  const handleEnterPress = () => {
    inputRef?.current?.blur?.();
    handleSearch(inputString.trim());
  };

  // Handle blur event - keep menu open if window loses focus (e.g., dev tools clicked)
  const handleBlur = () => {
    // Only close the menu if the document still has focus
    // If document doesn't have focus, user likely clicked on dev tools or another window
    if (document.hasFocus()) {
      onOpenChange(false);
    }
  };

  return (
    <Autocomplete<SearchOption>
      blurOnSelect={true}
      filterOptions={filterOptions}
      getOptionLabel={getOptionLabel}
      inputValue={inputString}
      isOptionEqualToValue={isOptionEqualToValue}
      loading={isLoading || externalLoading}
      onBlur={handleBlur}
      onChange={handleChange}
      onClose={(_event, reason) => {
        if (reason !== "toggleInput") {
          onOpenChange(false);
        }
      }}
      onFocus={() => onOpenChange(true)}
      onInputChange={handleInputValueChange}
      onOpen={() => onOpenChange(true)}
      open={open}
      openOnFocus={true}
      options={options}
      renderInput={(params) => (
        <SearchInput
          inputRef={inputRef}
          inputString={inputString}
          loading={isLoading || externalLoading}
          onClearSelection={handleClearSelection}
          onEnterPress={handleEnterPress}
          params={params}
        />
      )}
      renderOption={(props, option, state) =>
        renderOption(props, option, state, removeFromRecentSearches)
      }
      selectOnFocus={true}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "0 0 16px 16px",
          },
        },
        popper: {
          sx: {
            width: `${SEARCH_PANEL_WIDTH} !important`,
            marginLeft: `-24px !important`,
            zIndex: 1,
          },
        },
      }}
      sx={{ flex: 1 }}
      value={value}
    />
  );
};
