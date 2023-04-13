import { Meta, Story } from "@storybook/react";
import React from "react";
import {
  VehicleIcon,
  VehicleIconProps,
} from "../components/Map/Vehicle/VehicleIcon";
import { vehiclePositionMock } from "../mockData/VehiclePosition.mock";

export default {
  title: "Vehicle Icon",
  component: VehicleIcon,
  argTypes: { onClick: { action: "clicked" } },
} as Meta;

export const Basic: Story<VehicleIconProps> = (args) => (
  <VehicleIcon {...args} />
);
Basic.args = { bearing: vehiclePositionMock.position?.bearing || 0 };
