import CloseIcon from "@mui/icons-material/Close";
import { Drawer, IconButton, Toolbar } from "@mui/material";
import * as React from "react";

export interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const AppDrawer: React.FunctionComponent<AppDrawerProps> = ({
  open,
  onClose,
}) => {
  return (
    <Drawer
      anchor={"left"}
      onClose={onClose}
      open={open}
      sx={{
        "& .MuiDrawer-paper": {
          borderRadius: "0 10px 10px 0",
        },
      }}
    >
      <Toolbar>
        <IconButton
          aria-label={"close drawer"}
          edge={"start"}
          onClick={onClose}
          sx={{ ml: "auto" }}
        >
          <CloseIcon />
        </IconButton>
      </Toolbar>
    </Drawer>
  );
};
