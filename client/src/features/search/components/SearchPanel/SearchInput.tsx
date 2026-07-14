import { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import InputBase from "@mui/material/InputBase";
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
          inputString={inputString}
          loading={loading}
        />
      }
      inputProps={params.slotProps.htmlInput}
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
      ref={params.slotProps.input.ref}
      sx={{
        paddingLeft: 2.5,
        flex: 1,
        width: "100%",
      }}
    />
  );
};
