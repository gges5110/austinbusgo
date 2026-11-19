import {
  BOTTOM_TABS_HEIGHT,
  PHONE_SEARCH_BAR_HEIGHT,
  phoneSheetHeightPx,
  PhoneSheetSize,
} from "shared/layout/phoneLayout";

// Desktop: the menu panel (MENU_PANEL_WIDTH) over the left of the map
const SIDE_PANEL = 410;
// The chip row ("Buses near me" …) over the top of the map, from MUI's
// `md` breakpoint up (AssistiveChips): 16px margin + a 36px button
const CHIP_ROW = 52;
const CHIPS_MIN_WIDTH = 900;
// Never squeeze the visible map below this many pixels tall
const MIN_VISIBLE_HEIGHT = 80;

interface MapPaddingOptions {
  /** Room around framed targets, in pixels */
  margin?: number;
  /** Whether the search bar floats over the top (Explore; not Nearby) */
  searchBar?: boolean;
  /** Phone sheet size; defaults to the Explore panel's current size */
  sheet?: PhoneSheetSize;
}

/**
 * Camera padding matching the app's UI overlays, so flyTo/fitBounds center
 * targets in the *visible* part of the map: at MUI's `sm` breakpoint and up
 * the menu panel overlays the left of the map; below it the bottom sheet
 * (at its current size, above the tab bar) and the search bar.
 */
export const uiMapPadding = ({
  margin = 10,
  searchBar = true,
  sheet,
}: MapPaddingOptions = {}) => {
  // Keep in sync with theme.breakpoints.down("sm") used by the layout
  const isMobile = window.innerWidth < 600;
  if (!isMobile) {
    return {
      top: margin + (window.innerWidth >= CHIPS_MIN_WIDTH ? CHIP_ROW : 0),
      left: SIDE_PANEL + margin,
      right: margin,
      bottom: margin,
    };
  }
  const top = (searchBar ? PHONE_SEARCH_BAR_HEIGHT : 0) + margin;
  const covered = phoneSheetHeightPx(sheet) + BOTTOM_TABS_HEIGHT + margin;
  // A full-screen sheet or a short window leaves no room: keep a strip of
  // map rather than asking Mapbox for an impossible fit
  const bottom = Math.max(
    0,
    Math.min(covered, window.innerHeight - top - MIN_VISIBLE_HEIGHT)
  );
  return { top, left: margin, right: margin, bottom };
};
