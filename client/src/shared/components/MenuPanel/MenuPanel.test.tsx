import { createTheme, ThemeProvider } from "@mui/material";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MenuPanel } from "./MenuPanel";

// Mock useMediaQuery hook
const mockUseMediaQuery = vi.fn();
vi.mock("@mui/material", async () => {
  const actual = await vi.importActual("@mui/material");
  return {
    ...actual,
    useMediaQuery: () => mockUseMediaQuery(),
  };
});

const theme = createTheme();

describe("MenuPanel", () => {
  beforeEach(() => {
    mockUseMediaQuery.mockClear();
  });

  it("renders DesktopMenuPanel on desktop", () => {
    mockUseMediaQuery.mockReturnValue(false);

    render(
      <ThemeProvider theme={theme}>
        <MenuPanel>
          <div data-testid={"test-content"}>Test Content</div>
        </MenuPanel>
      </ThemeProvider>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("renders MobileMenuPanel on mobile", () => {
    mockUseMediaQuery.mockReturnValue(true);

    render(
      <ThemeProvider theme={theme}>
        <MenuPanel>
          <div data-testid={"test-content"}>Test Content</div>
        </MenuPanel>
      </ThemeProvider>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /collapse menu/i })
    ).toBeInTheDocument();
  });

  it("passes innerRef to child component", () => {
    mockUseMediaQuery.mockReturnValue(false);
    const ref = React.createRef<HTMLDivElement>();

    render(
      <ThemeProvider theme={theme}>
        <MenuPanel innerRef={ref as React.MutableRefObject<HTMLDivElement>}>
          <div>Test Content</div>
        </MenuPanel>
      </ThemeProvider>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("renders children correctly", () => {
    mockUseMediaQuery.mockReturnValue(false);

    render(
      <ThemeProvider theme={theme}>
        <MenuPanel>
          <div>Child 1</div>
          <div>Child 2</div>
        </MenuPanel>
      </ThemeProvider>
    );

    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
  });
});
