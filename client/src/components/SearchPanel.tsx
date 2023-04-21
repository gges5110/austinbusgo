import {
  Button,
  ButtonProps,
  debounce,
  Divider,
  IconButton,
  Popper,
  PopperProps,
  styled,
  Tooltip,
  TooltipProps,
} from "@material-ui/core";
import InputBase from "@material-ui/core/InputBase";
import Paper from "@material-ui/core/Paper";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import SettingsIcon from "@material-ui/icons/Settings";
import ClearIcon from "@material-ui/icons/Clear";
import { Autocomplete } from "@material-ui/lab";
import * as React from "react";
import { RunningTrip } from "../interfaces/interface.d";
import classNames from "classnames";
import { useHotkeys } from "react-hotkeys-hook";
import { useCallback, useRef } from "react";
import { PaperProps } from "@material-ui/core/Paper/Paper";

export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      margin: "8px 0px 8px 24px",
      display: "flex",
      alignItems: "center",
      width: "fit-content",
      borderRadius: "10px",
    },
    hotkeyButtonContainer: {
      padding: theme.spacing(1.5),
    },
    autoComplete: {
      width: 256,
      padding: 0,
      paddingRight: theme.spacing(3),
    },
    input: {
      paddingLeft: theme.spacing(2.5),
      flex: 1,
      width: "100%",
    },
    hotkeyButton: {
      "&:hover": {
        backgroundColor: "#fff",
        color: "#2196f3",
      },
    },
    settingsButton: {
      padding: theme.spacing(1.5),
      backgroundColor: "#fff",
      color: "#2196f3",
    },
    inactiveOptions: {
      color: "grey",
    },
  })
);

const StyledPopper: React.FunctionComponent<PopperProps> = (props) => (
  <Popper
    {...props}
    style={{
      width: 395,
      paddingTop: 20,
    }}
    placement="bottom-start"
  />
);

const StyledPaper: React.FunctionComponent<PaperProps> = (props) => {
  return (
    <Paper
      style={{
        borderRadius: 10,
      }}
      {...props}
    ></Paper>
  );
};

const useStylesBootstrap = makeStyles((theme) => ({
  arrow: {
    color: theme.palette.common.black,
  },
  tooltip: {
    backgroundColor: theme.palette.common.black,
    fontSize: 14,
  },
}));

const StyledTooltip: React.FunctionComponent<TooltipProps> = (props) => {
  const classes = useStylesBootstrap();

  return <Tooltip classes={classes} {...props} />;
};

const directionAbbreviationMapping: Map<string, string> = new Map([
  ["N", "North"],
  ["S", "South"],
  ["E", "East"],
  ["W", "West"],
  ["I", "Inbound"],
  ["O", "Outbound"],
]);

const HotkeyButton = styled(Button)<ButtonProps>(() => ({
  minWidth: "unset",
  borderRadius: "7px",
}));

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
      if (trip?.tripId !== newValue.tripId) {
        setTrip(newValue);
      }
    } else {
      setTrip(undefined);
    }
  };
  const ref = useRef();

  const focusAutocomplete = () => {
    ref?.current?.focus?.();
  };

  useHotkeys(
    "ctrl+k",
    () => {
      focusAutocomplete();
    },
    []
  );

  const clearSelection = () => {
    setTrip(undefined);
  };

  const delayedQuery = useCallback(debounce(searchRouteOnChange, 500), []);

  return (
    <Paper className={classes.root}>
      <Autocomplete
        options={runningTrips || []}
        loading={loading}
        className={classes.autoComplete}
        value={trip || null}
        blurOnSelect={true}
        autoComplete={true}
        PaperComponent={StyledPaper}
        PopperComponent={StyledPopper}
        autoHighlight={true}
        openOnFocus={true}
        selectOnFocus={true}
        onHighlightChange={(event, option, reason) => {
          if (reason === "keyboard") {
            delayedQuery(event, option);
          }
        }}
        onChange={searchRouteOnChange}
        getOptionSelected={(option, value) => {
          return option.tripId === value.tripId;
        }}
        groupBy={(option) => (option.running ? "Running" : "Inactive" || "")}
        getOptionLabel={(option) =>
          `${option.routeId} ${option.routeLongName} ${option.dirAbbr}`
        }
        ListboxProps={{ style: { maxHeight: "60vh" } }}
        renderOption={(props) => {
          return (
            <div
              className={classNames({
                [classes.inactiveOptions]: !props.running,
              })}
            >
              <span style={{ width: 30, display: "inline-block" }}>
                {props.routeId}
              </span>{" "}
              <span style={{ fontWeight: "bold" }}>{props.routeLongName}</span>{" "}
              <span style={{ fontSize: 14 }}>
                {props.dirAbbr
                  ? directionAbbreviationMapping.get(props.dirAbbr) ||
                    props.dirAbbr
                  : ""}
              </span>
            </div>
          );
        }}
        renderInput={(params) => (
          <InputBase
            placeholder={"Search Routes"}
            ref={params.InputProps.ref}
            inputRef={ref}
            inputProps={{ ...params.inputProps, style: { padding: 0 } }}
            className={classes.input}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                ref?.current?.blur?.();
              }
            }}
          />
        )}
      />
      <div className={classes.hotkeyButtonContainer}>
        <StyledTooltip title="Start search" placement="bottom-end">
          <HotkeyButton
            variant="outlined"
            size="small"
            onClick={() => {
              focusAutocomplete();
            }}
            className={classes.hotkeyButton}
          >
            <div>⌘K</div>
          </HotkeyButton>
        </StyledTooltip>
      </div>
      <Divider style={{ height: 28 }} orientation="vertical" />
      {trip === undefined ? (
        <IconButton
          className={classes.settingsButton}
          aria-label="directions"
          onClick={openSettingsDialog}
        >
          <SettingsIcon />
        </IconButton>
      ) : (
        <StyledTooltip title="Clear search" placement="bottom-end">
          <IconButton
            className={classes.settingsButton}
            onClick={clearSelection}
          >
            <ClearIcon />
          </IconButton>
        </StyledTooltip>
      )}
    </Paper>
  );
};
