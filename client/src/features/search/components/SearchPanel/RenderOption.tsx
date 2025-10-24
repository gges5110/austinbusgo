import HistoryIcon from "@mui/icons-material/History";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RouteIcon from "@mui/icons-material/Route";
import SearchIcon from "@mui/icons-material/Search";
import { Box } from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete/Autocomplete";
import * as React from "react";

import { Highlight } from "./Highlight/Highlight";
import {
  isRoute,
  isSearchTerm,
  isStop,
  SearchOption,
  SearchType,
} from "./hooks/searchPanelUtils";

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
            <HistoryIcon color={"neutral"} sx={{ fontSize: 20 }} />
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
            <Highlight query={inputValue} text={String(optionValue.routeId)} />
            <Highlight query={inputValue} text={optionValue.routeLongName} />
          </>
        )}
        {isStop(optionValue) && (
          <>
            <Highlight
              query={inputValue}
              text={String(optionValue.stopName || "")}
            />
            <Box color={"gray"}>
              <Highlight query={inputValue} text={String(optionValue.stopId)} />
            </Box>
          </>
        )}
        {isSearchTerm(optionValue) && (
          <Highlight query={inputValue} text={String(optionValue.value)} />
        )}
      </Box>
    </li>
  );
};
