import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RouteIcon from "@mui/icons-material/Route";
import SearchIcon from "@mui/icons-material/Search";
import { Box, IconButton } from "@mui/material";
import * as React from "react";

import { Highlight } from "./Highlight/Highlight";
import { OptionValue, SearchOption } from "./hooks/searchPanelUtils";

const ICON_SIZE = 24;

const OptionLabel: React.FC<{ inputValue: string; option: SearchOption }> = ({
  inputValue,
  option,
}) => {
  switch (option.kind) {
    case "route":
      return (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Highlight query={inputValue} text={String(option.route.routeId)} />
          <Highlight query={inputValue} text={option.route.routeLongName} />
        </Box>
      );
    case "stop":
      return (
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Highlight query={inputValue} text={option.stop.stopName ?? ""} />
          <Box color={"gray"}>
            <Highlight query={inputValue} text={String(option.stop.stopId)} />
          </Box>
        </Box>
      );
    case "term":
      return <Highlight query={inputValue} text={option.term} />;
    case "viewAll":
      return (
        <Box sx={{ color: "primary.main", fontWeight: 500 }}>
          {option.label}
        </Box>
      );
  }
};

const OptionIcon: React.FC<{ option: SearchOption }> = ({ option }) => {
  switch (option.kind) {
    case "term":
      return <SearchIcon sx={{ fontSize: ICON_SIZE }} />;
    case "route":
      return <RouteIcon sx={{ fontSize: ICON_SIZE }} />;
    default:
      return <PlaceOutlinedIcon sx={{ fontSize: ICON_SIZE }} />;
  }
};

interface SearchOptionRowProps {
  readonly inputValue: string;
  readonly liProps: React.HTMLAttributes<HTMLLIElement>;
  readonly onRemove?: (value: OptionValue) => void;
  readonly option: SearchOption;
}

export const SearchOptionRow: React.FC<SearchOptionRowProps> = ({
  inputValue,
  liProps,
  onRemove,
  option,
}) => (
  <li {...liProps}>
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
          {option.recent && (
            <Box
              sx={{
                height: 40,
                width: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "action.hover",
                borderRadius: "50%",
              }}
            >
              <AccessTimeIcon
                sx={{ fontSize: ICON_SIZE, color: "text.primary" }}
              />
            </Box>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <OptionLabel inputValue={inputValue} option={option} />
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
        {option.recent && onRemove ? (
          <IconButton
            aria-label={"Remove from recent searches"}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(option.optionValue);
            }}
            size={"small"}
            sx={{ padding: 0.5 }}
          >
            <CloseIcon sx={{ fontSize: ICON_SIZE }} />
          </IconButton>
        ) : (
          <OptionIcon option={option} />
        )}
      </Box>
    </Box>
  </li>
);
