import React from "react";
import { StopPin } from "./StopPin";
import { render } from "@testing-library/react";

describe("StopPin", () => {
  test("matches snapshot", () => {
    const { container } = render(
      <StopPin stopName={"4th/Guadalupe"} onClick={jest.fn()} />
    );
    expect(container).toMatchSnapshot();
  });
});
