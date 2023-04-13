import { Meta, Story } from "@storybook/react/types-6-0";
import React from "react";
import {
  ArrivalTimeListItem,
  ArrivalTimeListItemProps,
} from "../components/ArrivalTimeListItem";
import {
  arrivalTimesMock,
  arrivalTimeWithoutUpdateMock,
} from "../mockData/ArrivalTime.mock";

export default {
  title: "Arrival Time List Item",
  component: ArrivalTimeListItem,
  argTypes: { arrivalTimeOnClick: { action: "clicked" } },
} as Meta;

const Template: Story<ArrivalTimeListItemProps> = (args) => {
  return <ArrivalTimeListItem {...args} />;
};

export const WithUpdate = Template.bind({});
WithUpdate.args = {
  arrivalTime: arrivalTimesMock[0],
};

export const NoUpdate = Template.bind({});
NoUpdate.args = {
  arrivalTime: arrivalTimeWithoutUpdateMock,
};
