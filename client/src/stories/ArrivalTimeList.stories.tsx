import { Meta, Story } from "@storybook/react/types-6-0";
import React from "react";
import {
  ArrivalTimeList,
  ArrivalTimeListProps,
} from "../components/ArrivalTimeList";
import { arrivalTimesMock } from "../mockData/ArrivalTime.mock";

export default {
  title: "Arrival Time List",
  component: ArrivalTimeList,
  argTypes: { arrivalTimeOnClick: { action: "clicked" } },
} as Meta;

export const List: Story<ArrivalTimeListProps> = (args) => (
  <ArrivalTimeList {...args} />
);
List.args = { loading: false, arrivalTimes: arrivalTimesMock };
