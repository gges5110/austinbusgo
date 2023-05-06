import * as React from "react";
import { PropsWithChildren } from "react";
import { Box, Paper, Slide } from "@mui/material";

export const PANEL_WIDTH = "408px";
export const MenuPanel = ({ children }: PropsWithChildren) => {
  return (
    <Paper
      sx={{
        height: "100vh",
        width: PANEL_WIDTH,
        overflowY: "auto",
      }}
    >
      <Slide direction="right" in={true} mountOnEnter unmountOnExit>
        <Box component={"div"} sx={{ pt: 8 }}>
          {children}
        </Box>
      </Slide>
    </Paper>
  );
};
