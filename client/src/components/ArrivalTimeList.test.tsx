import React from "react";
import { arrivalTimesMock } from "../mockData/ArrivalTime.mock";
import { ArrivalTimeList } from "./ArrivalTimeList";
import { render } from "@testing-library/react";

describe("ArrivalTimeList", () => {
  test("matches snapshot", () => {
    const { container } = render(
      <ArrivalTimeList
        arrivalTimes={arrivalTimesMock}
        arrivalTimeOnClick={jest.fn()}
        loading={false}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
