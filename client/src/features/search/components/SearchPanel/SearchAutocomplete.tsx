import { Autocomplete, useMediaQuery, useTheme } from "@mui/material";
import * as React from "react";
import { useRef } from "react";

import {
  getOptionLabel,
  isOptionEqualToValue,
  SearchOption,
} from "./hooks/searchPanelUtils";
import { useSearchBox } from "./hooks/useSearchBox";
import { SearchInput } from "./SearchInput";
import { SearchOptionRow } from "./SearchOptionRow";
import { SEARCH_PANEL_WIDTH } from "./SearchPanel";

interface SearchAutocompleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Search results are matched and ranked server-side (fuzzy pg_trgm), so
// client-side substring re-filtering must not run — it would hide typo
// matches whose labels don't contain the typed text. Just cap the count.
const MAX_OPTIONS = 8;
const filterOptions = (options: SearchOption[]) =>
  options.slice(0, MAX_OPTIONS);

export const SearchAutocomplete: React.FunctionComponent<
  SearchAutocompleteProps
> = ({ open, onOpenChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    value,
    inputString,
    options,
    loading,
    handleInputValueChange,
    handleChange,
    handleClearSelection,
    handleEnterPress,
    removeFromRecentSearches,
  } = useSearchBox(onOpenChange);

  return (
    <Autocomplete<SearchOption>
      blurOnSelect={true}
      filterOptions={filterOptions}
      getOptionLabel={getOptionLabel}
      inputValue={inputString}
      isOptionEqualToValue={isOptionEqualToValue}
      loading={loading}
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
          loading={loading}
          onClearSelection={handleClearSelection}
          onEnterPress={() => {
            inputRef.current?.blur();
            handleEnterPress();
          }}
          params={params}
        />
      )}
      renderOption={(props, option, { inputValue }) => (
        <SearchOptionRow
          inputValue={inputValue}
          key={option.key}
          liProps={props}
          onRemove={removeFromRecentSearches}
          option={option}
        />
      )}
      selectOnFocus={true}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "0 0 16px 16px",
          },
        },
        popper: {
          sx: {
            width: isMobile
              ? "calc(100vw - 16px) !important"
              : `${SEARCH_PANEL_WIDTH} !important`,
            marginLeft: isMobile ? `-8px !important` : `-24px !important`,
            zIndex: 1,
          },
        },
      }}
      sx={{ flex: 1 }}
      value={value}
    />
  );
};
