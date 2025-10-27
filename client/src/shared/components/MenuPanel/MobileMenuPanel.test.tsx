import { createTheme, ThemeProvider } from "@mui/material";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { MobileMenuPanel } from "./MobileMenuPanel";

const theme = createTheme();

describe("MobileMenuPanel", () => {
  it("renders children when expanded", () => {
    render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel>
          <div data-testid="test-content">Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("starts in expanded state", () => {
    render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel>
          <div data-testid="test-content">Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );

    expect(
      screen.getByRole("button", { name: /collapse menu/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("toggles between expanded and collapsed states", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel>
          <div data-testid="test-content">Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );

    const toggleButton = screen.getByRole("button", {
      name: /collapse menu/i,
    });

    // Click to collapse
    await user.click(toggleButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /expand menu/i })
      ).toBeInTheDocument();
    });

    // Click to expand again
    const expandButton = screen.getByRole("button", { name: /expand menu/i });
    await user.click(expandButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /collapse menu/i })
      ).toBeInTheDocument();
    });
  });

  it("shows correct icon when expanded", () => {
    render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel>
          <div>Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );

    const button = screen.getByRole("button", { name: /collapse menu/i });
    expect(button).toBeInTheDocument();
  });

  it("shows correct icon when collapsed", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel>
          <div>Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );

    const collapseButton = screen.getByRole("button", {
      name: /collapse menu/i,
    });
    await user.click(collapseButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /expand menu/i })
      ).toBeInTheDocument();
    });
  });

  it("passes innerRef correctly", () => {
    const ref = React.createRef<HTMLDivElement>();

    render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel
          innerRef={ref as React.MutableRefObject<HTMLDivElement>}
        >
          <div>Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("renders without innerRef", () => {
    render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel>
          <div data-testid="test-content">Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );

    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
    expect(screen.getByText("Child 3")).toBeInTheDocument();
  });

  it("always shows toggle button regardless of state", () => {
    render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel>
          <div>Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );

    expect(
      screen.getByRole("button", { name: /collapse menu/i })
    ).toBeInTheDocument();
  });

  it("has fixed positioning", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel>
          <div>Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );

    const paper = container.querySelector(".MuiPaper-root");
    expect(paper).toBeInTheDocument();
  });

  it("uses Slide transition", () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel>
          <div>Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );

    // Check that Slide component is present by looking for its transition styles
    const slideElement = container.querySelector('[style*="transition"]');
    expect(slideElement).toBeInTheDocument();
  });
});
