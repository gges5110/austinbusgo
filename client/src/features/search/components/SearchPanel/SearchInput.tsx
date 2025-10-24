import InputBase from "@mui/material/InputBase";
import { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import * as React from "react";

import { InputEndAdornment } from "./InputEndAdornment/InputEndAdornment";

interface SearchInputProps {
  params: AutocompleteRenderInputParams;
  inputRef: React.RefObject<HTMLInputElement>;
  inputString: string;
  loading: boolean;
  onClearSelection: () => void;
  onEnterPress: () => void;
}

export const SearchInput: React.FunctionComponent<SearchInputProps> = ({
  params,
  inputRef,
  inputString,
  loading,
  onClearSelection,
  onEnterPress,
}) => {
  return (
    <InputBase
      endAdornment={
        <InputEndAdornment
          clearSelection={onClearSelection}
          goToSearchPage={onEnterPress}
          inputString={inputString}
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
  );
};
