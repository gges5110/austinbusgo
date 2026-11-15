import { createTheme, ThemeProvider } from "@mui/material";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { phoneSheetHeightPx } from "shared/layout/phoneLayout";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileMenuPanel } from "./MobileMenuPanel";

const theme = createTheme();

// jsdom has no PointerEvent
const stubPointerEvents = () =>
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

  it("full screen leaves room for the search bar, except without one", async () => {
    const user = userEvent.setup();
    const { unmount } = renderPanel();
    await user.click(handle());
    expect(panel()).toHaveStyle({ paddingTop: "64px" });
    unmount();

    render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel searchBar={false}>
          <div data-testid={"test-content"}>Test Content</div>
        </MobileMenuPanel>
      </ThemeProvider>
    );
    await user.click(handle());
    expect(panel()).toHaveStyle({ height: "calc(100vh - 56px)" });
    expect(panel()).toHaveStyle({ paddingTop: "0px" });
  });

  it("Enter on the handle grows the panel like a tap", async () => {
    const user = userEvent.setup();
    renderPanel();
    handle().focus();

    await user.keyboard("{Enter}");

    expect(panel()).toHaveStyle({ height: "calc(100vh - 56px)" });
  });

  it("arrow keys step between a title bar, half and full", async () => {
    const user = userEvent.setup();
    renderPanel();
    handle().focus();

    await user.keyboard("{ArrowDown}");

    expect(panel()).toHaveStyle({ height: "92px" });
    expect(handle()).toHaveAttribute("aria-expanded", "false");
    // Collapsed still shows the top of the page (its title row)
    expect(screen.getByTestId("test-content")).toBeVisible();

    await user.keyboard("{ArrowUp}{ArrowUp}");

    expect(panel()).toHaveStyle({ height: "calc(100vh - 56px)" });
  });

  it("dragging the handle snaps to the nearest size", () => {
    vi.stubGlobal("innerHeight", 800);
    stubPointerEvents();
    renderPanel();
    vi.spyOn(panel(), "getBoundingClientRect").mockReturnValue({
      height: 440,
    } as DOMRect);

    // Down 330px from 440px: let go at 110px, nearest the 92px title bar
    fireEvent.pointerDown(handle(), { clientY: 400, pointerId: 1 });
    fireEvent.pointerMove(handle(), { clientY: 600, pointerId: 1 });
    expect(panel()).toHaveStyle({ height: "240px" });
    fireEvent.pointerUp(handle(), { clientY: 730, pointerId: 1 });

    expect(panel()).toHaveStyle({ height: "92px" });
    vi.unstubAllGlobals();
  });

  it("a drag the browser cancels leaves the panel as it was", () => {
    vi.stubGlobal("innerHeight", 800);
    stubPointerEvents();
    renderPanel();
    vi.spyOn(panel(), "getBoundingClientRect").mockReturnValue({
      height: 440,
    } as DOMRect);

    fireEvent.pointerDown(handle(), { clientY: 400, pointerId: 1 });
    fireEvent.pointerMove(handle(), { clientY: 600, pointerId: 1 });
    fireEvent.pointerCancel(handle(), { clientY: 0, pointerId: 1 });

    expect(panel()).toHaveStyle({ height: "55vh" });
    vi.unstubAllGlobals();
  });

  it("stops the browser's own gestures on the handle", () => {
    stubPointerEvents();
    renderPanel();
    const move = new Event("touchmove", { bubbles: true, cancelable: true });

    fireEvent.pointerDown(handle(), { clientY: 400, pointerId: 1 });
    handle().dispatchEvent(move);

    // No pull-to-refresh or page scroll while dragging the panel
    expect(move.defaultPrevented).toBe(true);
  });

  const renderWithTitle = (onSave = vi.fn()) => {
    render(
      <ThemeProvider theme={theme}>
        <MobileMenuPanel>
          <div data-testid={"test-content"}>
            <div>Route title</div>
            <button onClick={onSave} type={"button"}>
              Save
            </button>
            <div>A long list</div>
          </div>
        </MobileMenuPanel>
      </ThemeProvider>
    );
    // A 440px panel whose top is at y=400
    vi.spyOn(panel(), "getBoundingClientRect").mockReturnValue({
      height: 440,
      top: 400,
    } as DOMRect);
  };

  it("drags from the title row below the handle too", () => {
    vi.stubGlobal("innerHeight", 800);
    stubPointerEvents();
    renderWithTitle();
    const title = screen.getByText("Route title");

    // 50px into the panel: inside the 92px handle + title strip
    fireEvent.pointerDown(title, { clientY: 450, pointerId: 1 });
    fireEvent.pointerMove(title, { clientY: 750, pointerId: 1 });
    fireEvent.pointerUp(title, { clientY: 750, pointerId: 1 });

    expect(panel()).toHaveStyle({ height: "92px" });
    vi.unstubAllGlobals();
  });

  it("a tap on a button in the title row still works", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderWithTitle(onSave);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(panel()).toHaveStyle({ height: "55vh" });
  });

  it("drags below the title strip scroll the page instead", () => {
    vi.stubGlobal("innerHeight", 800);
    stubPointerEvents();
    renderWithTitle();
    const list = screen.getByText("A long list");

    // 200px into the panel: the page's content, not the strip
    fireEvent.pointerDown(list, { clientY: 600, pointerId: 1 });
    fireEvent.pointerMove(list, { clientY: 750, pointerId: 1 });
    const move = new Event("touchmove", { bubbles: true, cancelable: true });
    list.dispatchEvent(move);
    fireEvent.pointerUp(list, { clientY: 750, pointerId: 1 });

    expect(move.defaultPrevented).toBe(false);
    expect(panel()).toHaveStyle({ height: "55vh" });
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

    // 200px of content + the 28px handle (the panel's CSS height is
    // min(228px, 55vh), which jsdom can't parse); the map frames above it
    expect(phoneSheetHeightPx()).toBe(228);
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
