import * as React from "react";
import { PropsWithChildren } from "react";
import { Box, Paper, Slide } from "@mui/material";

export const MENU_PANEL_WIDTH = "408px";

interface MenuPanelProps {
  innerRef?: React.MutableRefObject<HTMLDivElement | null>;
}

export const MenuPanel = ({
  children,
  innerRef,
}: PropsWithChildren<MenuPanelProps>) => {
  return (
    <Paper
      sx={{
        height: "100vh",
        width: MENU_PANEL_WIDTH,
        overflowY: "auto",
      }}
      ref={innerRef}
    >
      <Slide direction="right" in={true} mountOnEnter unmountOnExit>
        <Box component={"div"} sx={{ pt: 8 }}>
          {children}
        </Box>
      </Slide>
    </Paper>
  );
};
