/**
 * Camera padding matching the app's UI overlays, so flyTo/fitBounds center
 * targets in the *visible* part of the map: at MUI's `sm` breakpoint and up
 * the menu panel overlays the left ~420px; below it a bottom sheet covers
 * roughly the lower third.
 */
export const uiMapPadding = () => {
  // Keep in sync with theme.breakpoints.down("sm") used by the layout
  const isMobile = window.innerWidth < 600;
  return {
    top: 10,
    left: isMobile ? 10 : 420,
    right: 10,
    bottom: isMobile ? Math.round(window.innerHeight * 0.3) : 10,
  };
};
