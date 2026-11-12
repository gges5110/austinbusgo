/**
 * Phone layout measurements shared by the UI (sheets, tab bar) and the map
 * (camera padding), so the map frames targets in the part of the screen
 * that's actually visible.
 */

/** Height of the bottom tab bar, in pixels */
export const BOTTOM_TABS_HEIGHT = 56;

/** The search bar floating over the top of Explore screens, in pixels */
export const PHONE_SEARCH_BAR_HEIGHT = 64;

/**
 * Share of the screen (vh) a half-open sheet covers (Nearby's sheet, and
 * Explore panels by default), leaving the map visible above it.
 */
export const PHONE_SHEET_HEIGHT_VH = 55;

/** A collapsed Explore panel: just its controls, in pixels */
export const PHONE_SHEET_COLLAPSED_HEIGHT = 48;

export type PhoneSheetSize = "collapsed" | "half" | "full";

// The Explore panel's current size; "half" when none is open. Module state
// rather than an atom because the map reads it imperatively at fly time.
let currentSize: PhoneSheetSize = "half";

export const setPhoneSheetSize = (size: PhoneSheetSize) => {
  currentSize = size;
};

export const phoneSheetSize = () => currentSize;

/** Pixels a sheet of `size` covers above the tab bar */
export const phoneSheetHeightPx = (size: PhoneSheetSize = currentSize) => {
  switch (size) {
    case "collapsed":
      return PHONE_SHEET_COLLAPSED_HEIGHT;
    case "full":
      return window.innerHeight - BOTTOM_TABS_HEIGHT;
    default:
      return Math.round((window.innerHeight * PHONE_SHEET_HEIGHT_VH) / 100);
  }
};
