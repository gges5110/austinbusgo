import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { MobileMenuPanel } from "./MobileMenuPanel";

describe("MobileMenuPanel accessibility", () => {
  it("has no accessibility violations when expanded", async () => {
    const { container } = render(
      <MobileMenuPanel>
        <div>Content</div>
      </MobileMenuPanel>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations when collapsed", async () => {
    const { container, getByRole } = render(
      <MobileMenuPanel>
        <div>Content</div>
      </MobileMenuPanel>
    );
    fireEvent.click(getByRole("button", { name: /collapse menu/i }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("toggle button has aria-expanded reflecting state", () => {
    const { getByRole } = render(
      <MobileMenuPanel>
        <div>Content</div>
      </MobileMenuPanel>
    );
    const btn = getByRole("button", { name: /collapse menu/i });
    expect(btn).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(btn);
    expect(getByRole("button", { name: /expand menu/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });
});
