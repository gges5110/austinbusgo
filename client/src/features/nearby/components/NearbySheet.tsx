import { useMediaQuery, useTheme } from "@mui/material";
import * as React from "react";
import { PropsWithChildren } from "react";
import { MenuPanel } from "shared/components/MenuPanel/MenuPanel";
import { MobileMenuPanel } from "shared/components/MenuPanel/MobileMenuPanel";

/**
 * Phones: the same resizable bottom panel as Explore (drag its top strip,
 * or tap the handle), so the map and the buses on it stay visible above.
 * There's no search bar on Nearby. Desktop: the usual side panel.
 */
export const NearbySheet: React.FC<PropsWithChildren> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!isMobile) {
    return <MenuPanel>{children}</MenuPanel>;
  }

  return <MobileMenuPanel searchBar={false}>{children}</MobileMenuPanel>;
};
