import * as React from "react";
import { PropsWithChildren } from "react";
import { Paper, Slide } from "@mui/material";
import { SEARCH_PANEL_WIDTH } from "./Route/SearchPanel";

export const MenuPanel = ({ children }: PropsWithChildren) => {
  return (
    <Paper
      sx={{
        maxHeight: "80vh",
        width: SEARCH_PANEL_WIDTH,
        m: 4,
        mt: 2,
        overflow: "hidden",
        borderRadius: 2.5,
      }}
    >
      <Slide direction="right" in={true} mountOnEnter unmountOnExit>
        <div>{children}</div>
      </Slide>
    </Paper>
  );
};
