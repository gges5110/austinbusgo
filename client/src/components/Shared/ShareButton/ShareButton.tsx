import { useSnackbar } from "notistack";
import { Box, Button, Typography } from "@mui/material";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import * as React from "react";

export const ShareButton = () => {
  const { enqueueSnackbar } = useSnackbar();
  const copy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      enqueueSnackbar("Copied to clipboard.");
    });
  };
  return (
    <Button sx={{ textTransform: "none" }} onClick={copy}>
      <Box display={"flex"} flexDirection={"column"} alignItems={"center"}>
        <ShareOutlinedIcon />
        <Typography sx={{ textAlign: "center", fontSize: "14px" }}>
          Share
        </Typography>
      </Box>
    </Button>
  );
};
