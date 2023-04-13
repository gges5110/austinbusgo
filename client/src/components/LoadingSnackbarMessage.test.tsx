import React from "react";
import { render } from "@testing-library/react";
import { LoadingSnackbarMessage } from "./LoadingSnackbarMessage";

describe("LoadingSnackbarMessage", () => {
  test("matches snapshot", () => {
    const { container } = render(
      <LoadingSnackbarMessage message={"new message loading"} />
    );
    expect(container).toMatchSnapshot();
  });
});
