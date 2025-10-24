import { Autocomplete, createFilterOptions } from "@mui/material";
import InputBase from "@mui/material/InputBase";
import * as React from "react";
import { useRef, useState } from "react";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { Route, Stop } from "shared/types/interface.d";

import {
  getOptionLabel,
  isRoute,
  isSearchTerm,
  isStop,
  SearchOption,
} from "./hooks/searchPanelUtils";
import { useSearchInput } from "./hooks/useSearchInput";
import { useSearchNavigation } from "./hooks/useSearchNavigation";
import { useSearchOptions } from "./hooks/useSearchOptions";
import { useSearchSync } from "./hooks/useSearchSync";
import { InputEndAdornment } from "./InputEndAdornment/InputEndAdornment";
import { renderOption } from "./RenderOption";
import { SEARCH_PANEL_WIDTH } from "./SearchPanel";

interface SearchAutocompleteProps {
  route?: Route;
  stop?: Stop;
  searchTerm?: string;
  loading?: boolean;
  setRoute: (route: Route) => void;
  setStop: (stop: Stop) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const filterOptions = createFilterOptions<SearchOption>({
  limit: 5,
});

export const SearchAutocomplete: React.FunctionComponent<SearchAutocompleteProps> = ({
  route,
  stop,
  searchTerm,
  loading: externalLoading = false,
  setRoute,
  setStop,
  open,
  onOpenChange,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState<SearchOption | null>(null);
  const { viewStatePathname } = useViewStatePathname();

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

  const { handleSelect, handleClear, handleSearch } = useSearchNavigation({
    route,
    setRoute,
    setStop,
    viewStatePathname,
  });

  // Sync input with URL parameters
  useSearchSync({
    route,
    stop,
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
        <InputBase
          endAdornment={
            <InputEndAdornment
              clearSelection={handleClearSelection}
              goToSearchPage={handleEnterPress}
              inputString={inputString}
              loading={isLoading || externalLoading}
            />
          }
          inputProps={params.inputProps}
          inputRef={inputRef}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              inputRef?.current?.blur?.();
            }
            if (event.key === "Enter") {
              handleEnterPress();
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
      sx={{ flex: 1 }}
      value={value}
    />
  );
};
