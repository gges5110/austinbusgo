import { IconButton } from "@material-ui/core";
import InputBase from "@material-ui/core/InputBase";
import Paper from "@material-ui/core/Paper";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import SettingsIcon from "@material-ui/icons/Settings";
import { Autocomplete } from "@material-ui/lab";
import * as React from "react";
import { RunningTrip } from "../interfaces/interface.d";
import classNames from "classnames";

export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginLeft: 25,
      marginTop: 10,
      padding: "2px 10px",
      display: "flex",
      alignItems: "center",
      width: 350,
    },
    autoComplete: {
      width: 300,
    },
    input: {
      marginLeft: theme.spacing(1),
      flex: 1,
      width: "100%",
    },
    iconButton: {
      marginLeft: 10,
      padding: 10,
    },
    inactiveOptions: {
      color: "grey",
    },
  })
);

export interface SearchPanelProps {
  readonly runningTrips: RunningTrip[];
  readonly loading?: boolean;
  readonly trip?: RunningTrip;
  setTrip(trip?: RunningTrip): void;
  openSettingsDialog(): void;
}

export const SearchPanel: React.FunctionComponent<SearchPanelProps> = ({
  runningTrips,
  loading,
  trip,
  setTrip,
  openSettingsDialog,
}) => {
  const classes = useStyles();

  const searchRouteOnChange = (
    // eslint-disable-next-line @typescript-eslint/ban-types
    event: React.ChangeEvent<{}>,
    newValue: RunningTrip | null
  ) => {
    if (newValue != null) {
      setTrip(newValue);
    } else {
      setTrip(undefined);
    }
  };

  return (
    <Paper className={classes.root}>
      <Autocomplete
        options={runningTrips || []}
        loading={loading}
        className={classes.autoComplete}
        value={trip || null}
        blurOnSelect={true}
        autoComplete={true}
        onChange={searchRouteOnChange}
        groupBy={(option) => option.routeId.charAt(0) || ""}
        getOptionLabel={(option) => option.routeLongName}
        ListboxProps={{ style: { maxHeight: "60vh" } }}
        renderOption={(props) => {
          return (
            <div
              className={classNames({
                [classes.inactiveOptions]: !props.running,
              })}
            >{`${props.routeId} ${props.routeLongName} ${props.dirAbbr}`}</div>
          );
        }}
        renderInput={(params) => (
          <InputBase
            placeholder={"Search Routes"}
            ref={params.InputProps.ref}
            inputProps={params.inputProps}
            className={classes.input}
          />
        )}
      />
      <IconButton
        className={classes.iconButton}
        aria-label="directions"
        onClick={openSettingsDialog}
      >
        <SettingsIcon />
      </IconButton>
    </Paper>
  );
};
