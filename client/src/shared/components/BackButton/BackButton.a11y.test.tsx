import { render } from "@testing-library/react";
import * as React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { BackButton } from "./BackButton";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

describe("BackButton accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <BackButton />
      </MemoryRouter>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has an accessible label", () => {
    const { getByRole } = render(
      <MemoryRouter>
        <BackButton />
      </MemoryRouter>
    );
    expect(getByRole("button", { name: /back/i })).toBeInTheDocument();
  });
});
