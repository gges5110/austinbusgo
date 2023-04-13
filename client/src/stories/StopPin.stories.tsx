import { Meta, Story } from "@storybook/react";
import React from "react";
import { StopPin, StopPinProps } from "../components/Map/Stop/StopPin";

export default {
  title: "Stop Pin",
  component: StopPin,
  argTypes: { onClick: { action: "clicked" } },
} as Meta;

export const Basic: Story<StopPinProps> = (args) => <StopPin {...args} />;
Basic.args = { stopName: "Lamar/Thurmond" };
