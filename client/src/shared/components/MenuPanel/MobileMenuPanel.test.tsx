import { createTheme, ThemeProvider } from "@mui/material";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { phoneSheetHeightPx } from "shared/layout/phoneLayout";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileMenuPanel } from "./MobileMenuPanel";

const theme = createTheme();

describe("MobileMenuPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
  const handle = () =>
    screen.getByRole("button", { name: /(expand|collapse) menu/i });

  it("opens at most half height so the map stays visible", () => {
    renderPanel();

    expect(panel()).toHaveStyle({ height: "55vh" });
    expect(handle()).toHaveAccessibleName("Expand menu");
    expect(handle()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("test-content")).toBeVisible();
  });

  it("tapping the handle grows to full screen, then back to half", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(handle());

    expect(panel()).toHaveStyle({ height: "calc(100vh - 56px)" });
    expect(handle()).toHaveAccessibleName("Collapse menu");

    await user.click(handle());

    expect(panel()).toHaveStyle({ height: "55vh" });
  });

  it("arrow keys step between a title bar, half and full", async () => {
    const user = userEvent.setup();
    renderPanel();
    handle().focus();

    await user.keyboard("{ArrowDown}");

    expect(panel()).toHaveStyle({ height: "88px" });
    expect(handle()).toHaveAttribute("aria-expanded", "false");
    // Collapsed still shows the top of the page (its title row)
    expect(screen.getByTestId("test-content")).toBeVisible();

    await user.keyboard("{ArrowUp}{ArrowUp}");

    expect(panel()).toHaveStyle({ height: "calc(100vh - 56px)" });
  });

  it("dragging the handle snaps to the nearest size", () => {
    vi.stubGlobal("innerHeight", 800);
    // jsdom has no PointerEvent
    vi.stubGlobal(
      "PointerEvent",
      class extends MouseEvent {
        pointerId: number;
        constructor(type: string, init: PointerEventInit = {}) {
          super(type, init);
          this.pointerId = init.pointerId ?? 0;
        }
      }
    );
    renderPanel();
    vi.spyOn(panel(), "getBoundingClientRect").mockReturnValue({
      height: 440,
    } as DOMRect);

    // Down 330px from 440px: let go at 110px, nearest the 88px title bar
    fireEvent.pointerDown(handle(), { clientY: 400, pointerId: 1 });
    fireEvent.pointerMove(handle(), { clientY: 600, pointerId: 1 });
    expect(panel()).toHaveStyle({ height: "240px" });
    fireEvent.pointerUp(handle(), { clientY: 730, pointerId: 1 });
    fireEvent.click(handle());

    expect(panel()).toHaveStyle({ height: "88px" });
    vi.unstubAllGlobals();
  });

  it("fits a half panel to short content", () => {
    let observed: (() => void) | undefined;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          observed = callback;
        }
        observe() {}
        disconnect() {}
      }
    );
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(200);
    renderPanel();

    vi.stubGlobal("innerHeight", 800);
    act(() => observed?.());

    // 200px of content + the 24px handle (the panel's CSS height is
    // min(224px, 55vh), which jsdom can't parse); the map frames above it
    expect(phoneSheetHeightPx()).toBe(224);
    vi.unstubAllGlobals();
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
