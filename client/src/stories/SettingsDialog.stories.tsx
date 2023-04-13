import { Meta, Story } from "@storybook/react";
import { SnackbarProvider } from "notistack";
import React from "react";
import {
  SettingsDialog,
  SettingsDialogProps,
} from "../components/SettingsDialog";

export default {
  title: "Settings Dialog",
  component: SettingsDialog,
  argTypes: {
    reloadVehiclePositions: { action: "reloadVehiclePositions" },
    setOpen: { action: "setOpen" },
    setAutoPolling: { action: "setAutoPolling" },
  },
} as Meta;

export const Basic: Story<SettingsDialogProps> = (args) => (
  <SnackbarProvider
    maxSnack={3}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "left",
    }}
    preventDuplicate={true}
    autoHideDuration={2000}
  >
    <SettingsDialog {...args} />
  </SnackbarProvider>
);
Basic.args = { open: true, autoPolling: false };
