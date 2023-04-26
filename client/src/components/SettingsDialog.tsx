import { createStyles, Dialog, Switch, Theme } from "@material-ui/core";
import AppBar from "@material-ui/core/AppBar";
import Fade from "@material-ui/core/Fade";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import makeStyles from "@material-ui/core/styles/makeStyles";
import AutorenewIcon from "@material-ui/icons/Autorenew";
import CodeIcon from "@material-ui/icons/Code";
import Toolbar from "@material-ui/core/Toolbar";
import { TransitionProps } from "@material-ui/core/transitions";
import CloseIcon from "@material-ui/icons/Close";
import { useSnackbar } from "notistack";
import * as React from "react";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    appBar: {
      position: "relative",
    },
    title: {
      marginLeft: theme.spacing(2),
      flex: 1,
    },
  })
);

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children?: React.ReactElement },
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
  const classes = useStyles();

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
      <AppBar className={classes.appBar}>
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
        <ListItem button={true} onClick={reloadVehiclePositions}>
          <ListItemIcon>
            <AutorenewIcon />
          </ListItemIcon>
          <ListItemText primary="Reload Vehicles" />
        </ListItem>

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
