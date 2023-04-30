import * as React from "react";
import { IconButton } from "@mui/material";
import RouteIcon from "@mui/icons-material/Route";
import PlaceIcon from "@mui/icons-material/Place";
import { useLocation, useNavigate } from "react-router-dom";

export enum SearchMode {
  Route,
  Stop,
}

export const SearchModeToggle: React.FunctionComponent = () => {
  const location = useLocation();
  const re = /^(\/@[-0-9.]+,[-0-9.]+,[0-9.]+z)(.*)/;
  const viewStatePathname = location.pathname.match(re)?.[1] || "";
  const searchMode =
    location.pathname.match(re)?.[2] === ""
      ? SearchMode.Route
      : SearchMode.Stop;

  const navigate = useNavigate();
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
          navigate(`${viewStatePathname}/stops`);
        } else {
          navigate(viewStatePathname);
        }
      }}
    >
      {searchMode == SearchMode.Route ? <RouteIcon /> : <PlaceIcon />}
    </IconButton>
  );
};
