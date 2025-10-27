import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  IconButton,
  Paper,
  Slide,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import * as React from "react";
import { PropsWithChildren, useState } from "react";

export const MENU_PANEL_WIDTH = "408px";
const COLLAPSED_HEIGHT = "48px";
const HEADER_HEIGHT = "64px";

interface MenuPanelProps {
  innerRef?: React.MutableRefObject<HTMLDivElement | null>;
}

export const MenuPanel = ({
  children,
  innerRef,
}: PropsWithChildren<MenuPanelProps>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Paper
      ref={innerRef}
      sx={{
        height: isMobile && !isExpanded ? COLLAPSED_HEIGHT : "100vh",
        width: isMobile ? "100vw" : MENU_PANEL_WIDTH,
        maxWidth: isMobile ? "100vw" : MENU_PANEL_WIDTH,
        overflowY: isMobile && !isExpanded ? "hidden" : "auto",
        position: isMobile ? "fixed" : "initial",
        bottom: isMobile ? 0 : "auto",
        left: isMobile ? 0 : "auto",
        display: isMobile ? "flex" : "block",
        flexDirection: isMobile ? "column" : "row",
        transition: "height 0.3s ease-in-out",
        zIndex: isMobile ? 1000 : "auto",
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
            pt: isMobile ? HEADER_HEIGHT : 8,
            flex: isMobile ? 1 : "none",
            overflowY: isMobile ? "auto" : "visible",
            display: isMobile && !isExpanded ? "none" : "block",
          }}
        >
          {children}
        </Box>
      </Slide>
      {isMobile && (
        <Box
          sx={{
            height: COLLAPSED_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <IconButton
            aria-label={isExpanded ? "Collapse menu" : "Expand menu"}
            onClick={toggleExpanded}
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: 0,
            }}
          >
            {isExpanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
      )}
    </Paper>
  );
};
