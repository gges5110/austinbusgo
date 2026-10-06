import BookmarkIcon from "@mui/icons-material/Bookmark";
import ExploreIcon from "@mui/icons-material/Explore";
import NearMeIcon from "@mui/icons-material/NearMe";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import * as React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";

export const BOTTOM_TABS_HEIGHT = 56;

// Explore opens the map at the current view; a bare "/" would redirect
// phones back to Nearby
const DEFAULT_VIEW_STATE = "/@30.2672,-97.7431,11.5z";

export type BottomTab = "nearby" | "explore" | "saved";

export const tabForPath = (pathname: string): BottomTab => {
  if (pathname === "/nearby" || pathname.startsWith("/nearby/")) {
    return "nearby";
  }
  if (pathname.startsWith("/favorites")) return "saved";
  return "explore";
};

/** Phone-only primary navigation: Nearby / Explore / Saved. */
export const BottomTabs: React.FC = () => {
  const { pathname } = useLocation();
  const { viewStatePathname } = useViewStatePathname();
  const viewState = viewStatePathname || DEFAULT_VIEW_STATE;

  return (
    <Paper
      component={"nav"}
      elevation={8}
      sx={{
        bottom: 0,
        left: 0,
        position: "fixed",
        right: 0,
        zIndex: 1100,
      }}
    >
      <BottomNavigation
        showLabels={true}
        sx={{ height: BOTTOM_TABS_HEIGHT }}
        value={tabForPath(pathname)}
      >
        <BottomNavigationAction
          component={RouterLink}
          icon={<NearMeIcon />}
          label={"Nearby"}
          to={"/nearby"}
          value={"nearby"}
        />
        <BottomNavigationAction
          component={RouterLink}
          icon={<ExploreIcon />}
          label={"Explore"}
          to={viewState}
          value={"explore"}
        />
        <BottomNavigationAction
          component={RouterLink}
          icon={<BookmarkIcon />}
          label={"Saved"}
          to={`/favorites${viewStatePathname}`}
          value={"saved"}
        />
      </BottomNavigation>
    </Paper>
  );
};
