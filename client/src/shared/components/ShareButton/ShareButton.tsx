import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { useSnackbar } from "notistack";
import * as React from "react";
import { pageType, track } from "shared/track";

interface ShareButtonProps {
  /** Icon only, for headers */
  compact?: boolean;
}

export const ShareButton = ({ compact = false }: ShareButtonProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const copy = () => {
    const { pathname } = window.location;
    track("share", [pageType(pathname), pathname.split("/")[2]]);
    navigator.clipboard.writeText(window.location.href).then(() => {
      enqueueSnackbar("Copied to clipboard.");
    });
  };
  if (compact) {
    return (
      <IconButton aria-label={"Share"} onClick={copy} title={"Copy link"}>
        <ShareOutlinedIcon />
      </IconButton>
    );
  }
  return (
    <Button onClick={copy} sx={{ textTransform: "none" }}>
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ShareOutlinedIcon />
        <Typography sx={{ textAlign: "center", fontSize: "14px" }}>
          Share
        </Typography>
      </Box>
    </Button>
  );
};
