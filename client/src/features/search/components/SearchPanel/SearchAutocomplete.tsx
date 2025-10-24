import { Autocomplete, createFilterOptions } from "@mui/material";
import InputBase from "@mui/material/InputBase";
import * as React from "react";

import {
  getOptionLabel,
  isRoute,
  isSearchTerm,
  isStop,
  SearchOption,
} from "./hooks/searchPanelUtils";
import { InputEndAdornment } from "./InputEndAdornment/InputEndAdornment";
import { renderOption } from "./RenderOption";
import { SEARCH_PANEL_WIDTH } from "./SearchPanel";

interface SearchAutocompleteProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onBlur: () => void;
  onFocus: () => void;
  value: SearchOption | null;
  onChange: (
    event: React.SyntheticEvent,
    newValue: SearchOption | null
  ) => void;
  inputValue: string;
  onInputChange: (event: React.SyntheticEvent, value: string) => void;
  options: SearchOption[];
  loading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onClearSelection: () => void;
  onEnterPress: () => void;
}

const filterOptions = createFilterOptions<SearchOption>({
  limit: 5,
});

export const SearchAutocomplete: React.FunctionComponent<SearchAutocompleteProps> = ({
  open,
  onOpen,
  onClose,
  onBlur,
  onFocus,
  value,
  onChange,
  inputValue,
  onInputChange,
  options,
  loading,
  inputRef,
  onClearSelection,
  onEnterPress,
}) => {
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
      inputValue={inputValue}
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
      loading={loading}
      onBlur={onBlur}
      onChange={onChange}
      onClose={(event, reason) => {
        if (reason !== "toggleInput") {
          onClose();
        }
      }}
      onFocus={onFocus}
      onInputChange={onInputChange}
      onOpen={onOpen}
      open={open}
      openOnFocus={true}
      options={options}
      renderInput={(params) => (
        <InputBase
          endAdornment={
            <InputEndAdornment
              clearSelection={onClearSelection}
              goToSearchPage={onEnterPress}
              inputString={inputValue}
              loading={loading}
            />
          }
          inputProps={params.inputProps}
          inputRef={inputRef}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              inputRef?.current?.blur?.();
            }
            if (event.key === "Enter") {
              onEnterPress();
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
