import { render } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { MapPeekSheet } from "./MapPeekSheet";

describe("MapPeekSheet accessibility", () => {
  it("has no accessibility violations when open", async () => {
    const { container } = render(
      <MapPeekSheet onClose={vi.fn()} open={true}>
        <p>Peek content</p>
      </MapPeekSheet>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("close button has accessible label", () => {
    const { getByRole } = render(
      <MapPeekSheet onClose={vi.fn()} open={true}>
        <p>Peek content</p>
      </MapPeekSheet>
    );
    expect(getByRole("button", { name: /close/i })).toBeInTheDocument();
  });
});
