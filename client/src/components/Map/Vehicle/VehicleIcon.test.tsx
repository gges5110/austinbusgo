import React from "react";
import { render } from "@testing-library/react";
import { VehicleIcon } from "./VehicleIcon";

describe("VehicleIcon", () => {
  test("matches snapshot", () => {
    const { container } = render(
      <VehicleIcon bearing={45} onClick={jest.fn()} />
    );
    expect(container).toMatchSnapshot();
  });
});
