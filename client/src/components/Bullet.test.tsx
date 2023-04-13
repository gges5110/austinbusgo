import React from "react";
import { render } from "@testing-library/react";
import { Bullet } from "./Bullet";

describe("Bullet", () => {
  test("matches snapshot", () => {
    const { container } = render(<Bullet />);
    expect(container).toMatchSnapshot();
  });
});
