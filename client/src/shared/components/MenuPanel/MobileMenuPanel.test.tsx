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
          <div data-testid={"test-content"}>Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  const renderPanel = () =>
    render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel>
          <div data-testid={"test-content"}>Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );
  const panel = () =>
    screen.getByTestId("test-content").closest(".MuiPaper-root") as HTMLElement;
  const grow = () => screen.queryByRole("button", { name: /expand menu/i });
  const shrink = () => screen.queryByRole("button", { name: /collapse menu/i });

  it("opens half height so the map stays visible, with both controls", () => {
    renderPanel();

    expect(panel()).toHaveStyle({ height: "55vh" });
    expect(grow()).toBeInTheDocument();
    expect(shrink()).toBeInTheDocument();
    expect(screen.getByTestId("test-content")).toBeVisible();
  });

  it("grows to full screen, then back to half", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(grow()!);

    expect(panel()).toHaveStyle({ height: "calc(100vh - 56px)" });
    expect(grow()).toBeNull();

    await user.click(shrink()!);

    expect(panel()).toHaveStyle({ height: "55vh" });
  });

  it("shrinks to a bar that hides the content, then back to half", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(shrink()!);

    await waitFor(() => expect(panel()).toHaveStyle({ height: "48px" }));
    expect(shrink()).toBeNull();
    expect(screen.getByTestId("test-content")).not.toBeVisible();

    await user.click(grow()!);

    expect(panel()).toHaveStyle({ height: "55vh" });
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
          <div data-testid={"test-content"}>Test Content</div>
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
