import AccessTimeIcon from "@mui/icons-material/AccessTime";
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

const ICON_SIZE = 24;

export const renderOption: AutocompleteProps<
  SearchOption,
  boolean,
  boolean,
  boolean
>["renderOption"] = (props, option, { inputValue }) => {
  const { optionValue } = option;

  return (
    <li {...props}>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          justifyContent: "space-between",
          width: "100%",
          minHeight: "33px",
          padding: "6px 0 6px 4px",
        }}
      >
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
              <Box
                sx={{
                  height: 40,
                  width: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f2f2f2",
                  borderRadius: "50%",
                }}
              >
                <AccessTimeIcon
                  sx={{ fontSize: ICON_SIZE, color: "#1f1f1f" }}
                />
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isRoute(optionValue) && (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Highlight
                  query={inputValue}
                  text={String(optionValue.routeId)}
                />
                <Highlight
                  query={inputValue}
                  text={optionValue.routeLongName}
                />
              </Box>
            )}
            {isStop(optionValue) && (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Highlight
                  query={inputValue}
                  text={String(optionValue.stopName || "")}
                />
                <Box color={"gray"}>
                  <Highlight
                    query={inputValue}
                    text={String(optionValue.stopId)}
                  />
                </Box>
              </Box>
            )}
            {isSearchTerm(optionValue) && (
              <Highlight query={inputValue} text={String(optionValue.value)} />
            )}
          </Box>
        </Box>

        <Box
          sx={{
            pr: 2,
            display: "flex",
            alignItems: "center",
            gap: 0.8,
          }}
        >
          {isSearchTerm(optionValue) ? (
            <SearchIcon sx={{ fontSize: ICON_SIZE }} />
          ) : isRoute(optionValue) ? (
            <RouteIcon sx={{ fontSize: ICON_SIZE }} />
          ) : (
            <PlaceOutlinedIcon sx={{ fontSize: ICON_SIZE }} />
          )}
        </Box>
      </Box>
    </li>
  );
};
