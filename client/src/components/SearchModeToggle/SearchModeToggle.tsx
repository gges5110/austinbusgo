import * as React from "react";
import { useAtom } from "jotai/index";
import { searchModeAtom } from "../../Atoms";
import { IconButton } from "@mui/material";
import RouteIcon from "@mui/icons-material/Route";
import PlaceIcon from "@mui/icons-material/Place";

export enum SearchMode {
  Route,
  Stop,
}

export const SearchModeToggle: React.FunctionComponent = () => {
  const [searchMode, setSearchMode] = useAtom(searchModeAtom);
  return (
    <IconButton
      sx={{
        "&:hover": {
          backgroundColor: "#fff",
          color: "#2196f3",
        },
      }}
      color={"neutral"}
      onClick={() => {
        if (searchMode == SearchMode.Route) {
          setSearchMode(SearchMode.Stop);
        } else {
          setSearchMode(SearchMode.Route);
        }
      }}
    >
      {searchMode == SearchMode.Route ? <RouteIcon /> : <PlaceIcon />}
    </IconButton>
  );
};
