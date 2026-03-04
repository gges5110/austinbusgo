import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, IconButton, Paper, Slide } from "@mui/material";
import * as React from "react";
import { PropsWithChildren, useState } from "react";

const COLLAPSED_HEIGHT = "48px";
const HEADER_HEIGHT = "64px";

interface MobileMenuPanelProps {
  innerRef?: React.MutableRefObject<HTMLDivElement | null>;
}

export const MobileMenuPanel = ({
  children,
  innerRef,
}: PropsWithChildren<MobileMenuPanelProps>) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Paper
      ref={innerRef}
      sx={{
        height: isExpanded ? "100vh" : COLLAPSED_HEIGHT,
        width: "100vw",
        maxWidth: "100vw",
        overflowY: isExpanded ? "auto" : "hidden",
        position: "fixed",
        bottom: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
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
            pt: HEADER_HEIGHT,
            flex: 1,
            overflowY: "auto",
            display: isExpanded ? "block" : "none",
          }}
        >
          {children}
        </Box>
      </Slide>
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
          aria-expanded={isExpanded}
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
    </Paper>
  );
};
