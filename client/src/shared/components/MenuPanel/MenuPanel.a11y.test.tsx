import { createTheme, ThemeProvider } from "@mui/material";
import { render } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { axe } from "vitest-axe";
import { MenuPanel } from "./MenuPanel";

const mockUseMediaQuery = vi.fn();
vi.mock("@mui/material", async () => {
  const actual = await vi.importActual("@mui/material");
  return {
    ...actual,
    useMediaQuery: () => mockUseMediaQuery(),
  };
});

const theme = createTheme();

describe("MenuPanel accessibility", () => {
  beforeEach(() => {
    mockUseMediaQuery.mockClear();
  });

  it("has no accessibility violations on desktop", async () => {
    mockUseMediaQuery.mockReturnValue(false);

    const { container } = render(
      <ThemeProvider theme={theme}>
        <MenuPanel>
          <div>Test Content</div>
        </MenuPanel>
      </ThemeProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations on mobile", async () => {
    mockUseMediaQuery.mockReturnValue(true);

    const { container } = render(
      <ThemeProvider theme={theme}>
        <MenuPanel>
          <div>Test Content</div>
        </MenuPanel>
      </ThemeProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
