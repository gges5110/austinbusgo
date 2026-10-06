import { Paper, useMediaQuery, useTheme } from "@mui/material";
import * as React from "react";
import { PropsWithChildren } from "react";
import { BOTTOM_TABS_HEIGHT } from "shared/components/BottomTabs/BottomTabs";
import { MenuPanel } from "shared/components/MenuPanel/MenuPanel";

/** Share of a phone screen (vh) the sheet covers; the map shows above it */
export const NEARBY_SHEET_HEIGHT_VH = 55;

/**
 * Phones: a fixed sheet over the lower part of the screen so the map (and
 * the buses on it) stays visible above. Desktop: the usual side panel.
 */
export const NearbySheet: React.FC<PropsWithChildren> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!isMobile) {
    return <MenuPanel>{children}</MenuPanel>;
  }

  return (
    <Paper
      elevation={8}
      sx={{
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        bottom: BOTTOM_TABS_HEIGHT,
        height: `${NEARBY_SHEET_HEIGHT_VH}vh`,
        left: 0,
        overflowY: "auto",
        position: "fixed",
        width: "100vw",
        zIndex: 1000,
      }}
    >
      {children}
    </Paper>
  );
};
