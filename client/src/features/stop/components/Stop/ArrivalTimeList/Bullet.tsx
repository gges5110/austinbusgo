import { Box } from "@mui/material";
import * as React from "react";

export const Bullet: React.FunctionComponent = () => (
  <Box
    component={"span"}
    sx={{
      display: "inline-block",
      margin: "0 2px",
      transform: "scale(0.8)",
    }}
  >
    •
  </Box>
);
