import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, IconButton, Paper, Slide } from "@mui/material";
import * as React from "react";
import { PropsWithChildren, useEffect, useState } from "react";
import {
  BOTTOM_TABS_HEIGHT,
  PHONE_SEARCH_BAR_HEIGHT,
  PHONE_SHEET_COLLAPSED_HEIGHT,
  PHONE_SHEET_HEIGHT_VH,
  PhoneSheetSize,
  setPhoneSheetSize,
} from "shared/layout/phoneLayout";

const COLLAPSED_HEIGHT = `${PHONE_SHEET_COLLAPSED_HEIGHT}px`;
// Room for the search bar, which floats over the top of the screen
const HEADER_HEIGHT = `${PHONE_SEARCH_BAR_HEIGHT}px`;

type SheetSize = PhoneSheetSize;
const SIZES: SheetSize[] = ["collapsed", "half", "full"];

const HEIGHTS: Record<SheetSize, string> = {
  collapsed: COLLAPSED_HEIGHT,
  half: `${PHONE_SHEET_HEIGHT_VH}vh`,
  full: `calc(100vh - ${BOTTOM_TABS_HEIGHT}px)`,
};

interface MobileMenuPanelProps {
  innerRef?: React.MutableRefObject<HTMLDivElement | null>;
}

/**
 * The phone panel for Explore pages (stop, route, trip, search, saved).
 * Opens half height like Google Maps, so the map stays in view; riders can
 * grow it to full screen for long lists or shrink it to a bar.
 */
export const MobileMenuPanel = ({
  children,
  innerRef,
}: PropsWithChildren<MobileMenuPanelProps>) => {
  const [size, setSize] = useState<SheetSize>("half");
  // Let the map frame targets above the panel at its current size
  useEffect(() => {
    setPhoneSheetSize(size);
    return () => setPhoneSheetSize("half");
  }, [size]);
  const step = (by: number) =>
    setSize((current) => SIZES[SIZES.indexOf(current) + by] ?? current);

  return (
    <Paper
      elevation={8}
      ref={innerRef}
      sx={{
        height: HEIGHTS[size],
        width: "100vw",
        maxWidth: "100vw",
        overflowY: size === "collapsed" ? "hidden" : "auto",
        position: "fixed",
        // Sits above the phone tab bar
        bottom: BOTTOM_TABS_HEIGHT,
        left: 0,
        display: "flex",
        flexDirection: "column",
        borderTopLeftRadius: size === "full" ? 0 : 16,
        borderTopRightRadius: size === "full" ? 0 : 16,
        transition: "height 0.3s ease-in-out",
        zIndex: 1000,
      }}
    >
      <Slide
        direction={"right"}
        in={true}
        mountOnEnter={true}
        unmountOnExit={true}
      >
        <Box
          component={"div"}
          sx={{
            pt: size === "full" ? HEADER_HEIGHT : 0,
            flex: 1,
            overflowY: "auto",
            display: size === "collapsed" ? "none" : "block",
          }}
        >
          {children}
        </Box>
      </Slide>
      <Box
        sx={{
          height: COLLAPSED_HEIGHT,
          display: "flex",
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        {size !== "collapsed" && (
          <IconButton
            aria-expanded={true}
            aria-label={"Collapse menu"}
            onClick={() => step(-1)}
            sx={{ flex: 1, borderRadius: 0 }}
            title={"Show more map"}
          >
            <ExpandMoreIcon />
          </IconButton>
        )}
        {size !== "full" && (
          <IconButton
            // Whether the panel's content is showing (hidden when collapsed)
            aria-expanded={size !== "collapsed"}
            aria-label={"Expand menu"}
            onClick={() => step(1)}
            sx={{ flex: 1, borderRadius: 0 }}
            title={"Show more list"}
          >
            <ExpandLessIcon />
          </IconButton>
        )}
      </Box>
    </Paper>
  );
};
