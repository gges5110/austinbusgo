import { Story } from "@storybook/react";
import React from "react";
import {
  VehiclePopupContent,
  VehiclePopupContentProps,
} from "../components/Map/Vehicle/VehiclePopupContent";
import { stopQuery } from "../mockData/Stop.mock";
import { tripQuery } from "../mockData/Trip.mock";
import { vehiclePositionMock } from "../mockData/VehiclePosition.mock";

export default {
  title: "Vehicle Popup Content",
  component: VehiclePopupContent,
};

export const Basic: Story<VehiclePopupContentProps> = (args) => (
  <VehiclePopupContent {...args} />
);

Basic.args = {
  vehiclePosition: vehiclePositionMock,
  stopLoading: false,
  tripLoading: false,
  stop: stopQuery,
  trip: tripQuery,
};
