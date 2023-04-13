import React from "react";
import { render } from "@testing-library/react";
import { runningTripsMock } from "../mockData/RunningTrip.mock";
import { SearchPanel } from "./SearchPanel";

describe("SearchPanel", () => {
  test("matches snapshot", () => {
    const { container } = render(
      <SearchPanel
        runningTrips={runningTripsMock}
        setTrip={jest.fn()}
        loading={false}
        openSettingsDialog={jest.fn()}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
