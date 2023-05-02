import { Dialog, Fade, ListItemButton, Switch } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CodeIcon from "@mui/icons-material/Code";
import Toolbar from "@mui/material/Toolbar";
import { TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";
import { useSnackbar } from "notistack";
import * as React from "react";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Fade ref={ref} {...props} />;
});

export interface SettingsDialogProps {
  readonly open: boolean;
  readonly autoPolling: boolean;
  setOpen(open: boolean): void;
  setAutoPolling(autoPolling: boolean): void;
  reloadVehiclePositions(): void;
}

export const SettingsDialog: React.FunctionComponent<SettingsDialogProps> = ({
  open,
  setOpen,
  autoPolling,
  setAutoPolling,
  reloadVehiclePositions,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  const handleClose = () => {
    setOpen(false);
  };

  const handleAutoPollingChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    enqueueSnackbar(
      event.target.checked ? "Auto Polling Enabled" : "Auto Polling Disabled"
    );
    setAutoPolling(event.target.checked);
  };

  return (
    <Dialog
      fullScreen={false}
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <List>
        <ListSubheader>Vehicle Live Position</ListSubheader>
        <ListItem>
          <ListItemIcon>
            <AutorenewIcon />
          </ListItemIcon>
          <ListItemText id="switch-list-label-wifi" primary="Auto Polling" />
          <ListItemSecondaryAction>
            <Switch
              checked={autoPolling}
              onChange={handleAutoPollingChange}
              value={"autoPolling"}
              inputProps={{ "aria-label": "secondary checkbox" }}
              edge="end"
            />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItemButton onClick={reloadVehiclePositions}>
          <ListItemIcon>
            <AutorenewIcon />
          </ListItemIcon>
          <ListItemText primary="Reload Vehicles" />
        </ListItemButton>

        <ListSubheader>About Austin Bus Go</ListSubheader>
        <ListItem
          button={true}
          onClick={() => {
            window.open("https://gitlab.com/gerrywu/AustinBusLocation");
          }}
        >
          <ListItemIcon>
            <CodeIcon />
          </ListItemIcon>
          <ListItemText primary="GitLab Repository" />
        </ListItem>
      </List>
    </Dialog>
  );
};
