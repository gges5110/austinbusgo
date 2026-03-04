import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, SwipeableDrawer } from "@mui/material";
import * as React from "react";

interface MapPeekSheetProps {
  children: React.ReactNode;
  onClose: () => void;
  open: boolean;
}

export const MapPeekSheet: React.FC<MapPeekSheetProps> = ({
  children,
  onClose,
  open,
}) => (
  <SwipeableDrawer
    anchor={"bottom"}
    disableSwipeToOpen={true}
    onClose={onClose}
    onOpen={() => {}}
    open={open}
    PaperProps={{
      sx: {
        borderRadius: "12px 12px 0 0",
        maxHeight: "55vh",
        pb: 3,
        px: 2,
      },
    }}
  >
    {/* Drag handle pill */}
    <Box
      sx={{
        bgcolor: "grey.400",
        borderRadius: 2,
        height: 4,
        mb: 0.5,
        mt: 1.5,
        mx: "auto",
        width: 40,
      }}
    />
    {/* Close button */}
    <IconButton
      aria-label={"Close"}
      onClick={onClose}
      size={"small"}
      sx={{ position: "absolute", right: 8, top: 8 }}
    >
      <CloseIcon fontSize={"small"} />
    </IconButton>
    <Box sx={{ mt: 1, overflowY: "auto" }}>{children}</Box>
  </SwipeableDrawer>
);
