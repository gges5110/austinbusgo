import * as React from "react";
import { Box } from "@mui/material";

export const Bullet: React.FunctionComponent = () => (
  <Box
    sx={{
      display: "inline-block",
      margin: "0 2px",
      transform: "scale(0.8)",
    }}
    component={"span"}
  >
    •
  </Box>
);
