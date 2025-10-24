import MenuIcon from "@mui/icons-material/Menu";
import { Box, IconButton } from "@mui/material";
import Paper from "@mui/material/Paper";
import * as React from "react";
import { useState } from "react";

import { SearchAutocomplete } from "./SearchAutocomplete";

export const SEARCH_PANEL_WIDTH = "392px";

export interface SearchPanelProps {
  onMenuClick(): void;
}

export const SearchPanel: React.FunctionComponent<SearchPanelProps> = ({
  onMenuClick,
}) => {
  const [searchPanelOpen, setSearchPanelOpen] = useState<boolean>(false);

  return (
    <Paper
      sx={{
        m: 1,
        borderRadius: searchPanelOpen ? "16px 16px 0 0" : "24px",
        boxShadow: searchPanelOpen ? 1 : 5,
        width: SEARCH_PANEL_WIDTH,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
        <IconButton
          aria-label={"menu"}
          edge={"start"}
          onClick={onMenuClick}
          sx={{ ml: 1 }}
        >
          <MenuIcon />
        </IconButton>
        <SearchAutocomplete
          onOpenChange={setSearchPanelOpen}
          open={searchPanelOpen}
        />
      </Box>
    </Paper>
  );
};
