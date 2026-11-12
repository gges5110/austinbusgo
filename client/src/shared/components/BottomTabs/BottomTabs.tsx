import BookmarkIcon from "@mui/icons-material/Bookmark";
import ExploreIcon from "@mui/icons-material/Explore";
import NearMeIcon from "@mui/icons-material/NearMe";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import * as React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { BOTTOM_TABS_HEIGHT } from "shared/layout/phoneLayout";

export { BOTTOM_TABS_HEIGHT };

// Explore opens the map at the current view; a bare "/" would redirect
// phones back to Nearby
const EXPLORE_PATH = "/@30.2672,-97.7431,11.5z";

/** Explore at the rider's current map view (the default view if none). */
export const useExplorePath = () => {
  const { viewStatePathname } = useViewStatePathname();
  return viewStatePathname || EXPLORE_PATH;
};

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
  const explorePath = useExplorePath();

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
          to={explorePath}
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
