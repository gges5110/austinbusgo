import { Autocomplete, createFilterOptions } from "@mui/material";
import * as React from "react";
import { useRef, useState } from "react";
import { useNavigation, useParams } from "react-router-dom";
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

  const navigation = useNavigation();
  const externalLoading = navigation.location !== undefined;

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

  const { options } = useSearchOptions({
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
    handleClear();
    setInputString("");
    setValue(null);
    onOpenChange(true);
  };

  // Handle search page navigation
  const handleEnterPress = () => {
    inputRef?.current?.blur?.();
    handleSearch(inputString.trim());
  };

  return (
    <Autocomplete<SearchOption>
      blurOnSelect={true}
      componentsProps={{
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
      filterOptions={filterOptions}
      getOptionLabel={getOptionLabel}
      inputValue={inputString}
      isOptionEqualToValue={isOptionEqualToValue}
      loading={isLoading || externalLoading}
      onBlur={() => onOpenChange(false)}
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
      renderOption={renderOption}
      selectOnFocus={true}
      sx={{ flex: 1 }}
      value={value}
    />
  );
};
