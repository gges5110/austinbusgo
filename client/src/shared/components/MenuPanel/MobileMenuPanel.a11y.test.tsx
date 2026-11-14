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
    fireEvent.keyDown(getByRole("button", { name: /expand menu/i }), {
      key: "ArrowDown",
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("handle has aria-expanded reflecting state", () => {
    const { getByRole } = render(
      <MobileMenuPanel>
        <div>Content</div>
      </MobileMenuPanel>
    );
    const handle = getByRole("button", { name: /expand menu/i });
    expect(handle).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(handle).toHaveAttribute("aria-expanded", "false");
  });
});
