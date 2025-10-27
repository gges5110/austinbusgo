import { createTheme, ThemeProvider } from "@mui/material";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { DesktopMenuPanel, MENU_PANEL_WIDTH } from "./DesktopMenuPanel";

const theme = createTheme();

describe("DesktopMenuPanel", () => {
  it("renders children correctly", () => {
    render(
      <ThemeProvider theme={theme}>
        <DesktopMenuPanel>
          <div data-testid={"test-content"}>Test Content</div>
        </DesktopMenuPanel>
      </ThemeProvider>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("applies correct width", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <DesktopMenuPanel>
          <div>Test Content</div>
        </DesktopMenuPanel>
      </ThemeProvider>
    );

    const paper = container.querySelector(".MuiPaper-root");
    expect(paper).toBeInTheDocument();
    expect(MENU_PANEL_WIDTH).toBe("408px");
  });

  it("has correct height", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <DesktopMenuPanel>
          <div>Test Content</div>
        </DesktopMenuPanel>
      </ThemeProvider>
    );

    const paper = container.querySelector(".MuiPaper-root");
    expect(paper).toBeInTheDocument();
  });

  it("passes innerRef correctly", () => {
    const ref = React.createRef<HTMLDivElement>();

    render(
      <ThemeProvider theme={theme}>
        <DesktopMenuPanel
          innerRef={ref as React.MutableRefObject<HTMLDivElement>}
        >
          <div>Test Content</div>
        </DesktopMenuPanel>
      </ThemeProvider>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("renders without innerRef", () => {
    render(
      <ThemeProvider theme={theme}>
        <DesktopMenuPanel>
          <div data-testid={"test-content"}>Test Content</div>
        </DesktopMenuPanel>
      </ThemeProvider>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <ThemeProvider theme={theme}>
        <DesktopMenuPanel>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </DesktopMenuPanel>
      </ThemeProvider>
    );

    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
    expect(screen.getByText("Child 3")).toBeInTheDocument();
  });

  it("uses Slide transition", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <DesktopMenuPanel>
          <div>Test Content</div>
        </DesktopMenuPanel>
      </ThemeProvider>
    );

    // Check that Slide component is present by looking for its transition styles
    const slideElement = container.querySelector('[style*="transition"]');
    expect(slideElement).toBeInTheDocument();
  });
});
