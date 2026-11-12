import { BOTTOM_TABS_HEIGHT } from "shared/components/BottomTabs/BottomTabs";
import { PHONE_SHEET_HEIGHT_VH } from "shared/components/MenuPanel/MobileMenuPanel";

const MARGIN = 10;
// The search bar floating over the top of a phone screen
const PHONE_SEARCH_BAR = 64;

/**
 * Camera padding matching the app's UI overlays, so flyTo/fitBounds center
 * targets in the *visible* part of the map: at MUI's `sm` breakpoint and up
 * the menu panel overlays the left ~420px; below it the half-open bottom
 * sheet (above the tab bar) and the search bar.
 */
export const uiMapPadding = () => {
  // Keep in sync with theme.breakpoints.down("sm") used by the layout
  const isMobile = window.innerWidth < 600;
  if (!isMobile) {
    return { top: MARGIN, left: 420, right: MARGIN, bottom: MARGIN };
  }
  const sheet = Math.round((window.innerHeight * PHONE_SHEET_HEIGHT_VH) / 100);
  return {
    top: PHONE_SEARCH_BAR + MARGIN,
    left: MARGIN,
    right: MARGIN,
    bottom: sheet + BOTTOM_TABS_HEIGHT + MARGIN,
  };
};
