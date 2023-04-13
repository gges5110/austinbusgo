import { Meta, Story } from "@storybook/react";
import React from "react";
import { SearchPanel, SearchPanelProps } from "../components/SearchPanel";
import { runningTripsMock } from "../mockData/RunningTrip.mock";

export default {
  title: "Search Panel",
  component: SearchPanel,
  argTypes: {
    setTrip: { action: "setTrip" },
    openSettingsDialog: { action: "openSettingsDialog" },
  },
} as Meta;

export const Basic: Story<SearchPanelProps> = (args) => (
  <SearchPanel {...args} />
);
Basic.args = { runningTrips: runningTripsMock, loading: false };
