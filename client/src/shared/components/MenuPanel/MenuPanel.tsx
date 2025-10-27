import { Box, Paper, Slide, useMediaQuery, useTheme } from "@mui/material";
import * as React from "react";
import { PropsWithChildren } from "react";

export const MENU_PANEL_WIDTH = "408px";

interface MenuPanelProps {
  innerRef?: React.MutableRefObject<HTMLDivElement | null>;
}

export const MenuPanel = ({
  children,
  innerRef,
}: PropsWithChildren<MenuPanelProps>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper
      ref={innerRef}
      sx={{
        height: "100vh",
        width: isMobile ? "100vw" : MENU_PANEL_WIDTH,
        maxWidth: isMobile ? "100vw" : MENU_PANEL_WIDTH,
        overflowY: "auto",
      }}
    >
      <Slide
        direction={"right"}
        in={true}
        mountOnEnter={true}
        unmountOnExit={true}
      >
        <Box component={"div"} sx={{ pt: 8 }}>
          {children}
        </Box>
      </Slide>
    </Paper>
  );
};
