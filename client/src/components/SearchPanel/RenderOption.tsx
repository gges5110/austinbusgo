import { AutocompleteProps } from "@mui/material/Autocomplete/Autocomplete";
import { Box } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import SearchIcon from "@mui/icons-material/Search";
import RouteIcon from "@mui/icons-material/Route";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { Highlight } from "./Highlight/Highlight";
import * as React from "react";
import {
  isRoute,
  isSearchTerm,
  isStop,
  SearchOption,
  SearchType,
} from "./SearchPanel";

export const renderOption: AutocompleteProps<
  SearchOption,
  boolean,
  boolean,
  boolean
>["renderOption"] = (props, option, { inputValue }) => {
  const { optionValue } = option;

  return (
    <li {...props}>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Box
          sx={{
            pr: 2,
            display: "flex",
            alignItems: "center",
            gap: 0.8,
          }}
        >
          {option.type === SearchType.recent && (
            <AccessTimeOutlinedIcon color={"neutral"} sx={{ fontSize: 20 }} />
          )}
          {isSearchTerm(optionValue) ? (
            <SearchIcon color={"neutral"} sx={{ fontSize: 20 }} />
          ) : isRoute(optionValue) ? (
            <RouteIcon color={"neutral"} sx={{ fontSize: 20 }} />
          ) : (
            <PlaceOutlinedIcon color={"neutral"} sx={{ fontSize: 20 }} />
          )}
        </Box>
        {isRoute(optionValue) && (
          <>
            <Highlight text={String(optionValue.routeId)} query={inputValue} />
            <Highlight text={optionValue.routeLongName} query={inputValue} />
          </>
        )}
        {isStop(optionValue) && (
          <>
            <Highlight text={String(optionValue.stopId)} query={inputValue} />
            <Highlight
              text={String(optionValue.stopName || "")}
              query={inputValue}
            />
          </>
        )}
        {isSearchTerm(optionValue) && (
          <Highlight text={String(optionValue.value)} query={inputValue} />
        )}
      </Box>
    </li>
  );
};
