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

/** The grab handle along the top of the Explore panel, in pixels */
export const PHONE_SHEET_HANDLE_HEIGHT = 28;

/** A page's title row at the top of the Explore panel, in pixels */
export const PHONE_SHEET_TITLE_HEIGHT = 64;

/**
 * A collapsed Explore panel, in pixels: the handle plus the page's title
 * row, so riders can still see what's open. Drags anywhere on this strip
 * resize the panel.
 */
export const PHONE_SHEET_COLLAPSED_HEIGHT =
  PHONE_SHEET_HANDLE_HEIGHT + PHONE_SHEET_TITLE_HEIGHT;

export type PhoneSheetSize = "collapsed" | "half" | "full";

// The Explore panel's current size; "half" when none is open. Module state
// rather than an atom because the map reads it imperatively at fly time.
let currentSize: PhoneSheetSize = "half";
// What the panel actually covers when it's measured (a half panel shrinks
// to fit short content)
let currentHeightPx: number | undefined;

export const setPhoneSheetSize = (size: PhoneSheetSize, heightPx?: number) => {
  currentSize = size;
  currentHeightPx = heightPx;
};

export const phoneSheetSize = () => currentSize;

/**
 * Pixels a sheet of `size` covers above the tab bar; without a size, what
 * the Explore panel covers right now
 */
export const phoneSheetHeightPx = (size?: PhoneSheetSize) => {
  if (!size && currentHeightPx !== undefined) return currentHeightPx;
  switch (size ?? currentSize) {
    case "collapsed":
      return PHONE_SHEET_COLLAPSED_HEIGHT;
    case "full":
      return window.innerHeight - BOTTOM_TABS_HEIGHT;
    default:
      return Math.round((window.innerHeight * PHONE_SHEET_HEIGHT_VH) / 100);
  }
};
