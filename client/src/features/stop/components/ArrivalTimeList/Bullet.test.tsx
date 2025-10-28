import { render, screen } from "@testing-library/react";
import React from "react";

import { Bullet } from "./Bullet";

describe("Bullet", () => {
  test("renders", () => {
    render(<Bullet />);

    const bulletNode = screen.getByText("•");

    expect(bulletNode).toBeTruthy();
  });
});
