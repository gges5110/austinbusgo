import { Box, Paper, Slide } from "@mui/material";
import * as React from "react";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import {
  BOTTOM_TABS_HEIGHT,
  PHONE_SEARCH_BAR_HEIGHT,
  PHONE_SHEET_COLLAPSED_HEIGHT,
  PHONE_SHEET_HANDLE_HEIGHT,
  PHONE_SHEET_HEIGHT_VH,
  PhoneSheetSize,
  setPhoneSheetSize,
} from "shared/layout/phoneLayout";

type SheetSize = PhoneSheetSize;
const SIZES: SheetSize[] = ["collapsed", "half", "full"];

// A drag shorter than this is a tap
const DRAG_THRESHOLD_PX = 8;

const fullHeightPx = () => window.innerHeight - BOTTOM_TABS_HEIGHT;
const halfHeightPx = () => (window.innerHeight * PHONE_SHEET_HEIGHT_VH) / 100;

/**
 * Natural height of the panel's content, or undefined where it can't be
 * measured (no ResizeObserver)
 */
const useContentHeight = (ref: React.RefObject<HTMLDivElement | null>) => {
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return height;
};

interface Drag {
  pointerId: number;
  startY: number;
  startHeight: number;
  moved: boolean;
  /** Started on the handle, so letting go without moving is a tap */
  onHandle: boolean;
}

interface MobileMenuPanelProps {
  innerRef?: React.MutableRefObject<HTMLDivElement | null>;
  /**
   * Whether the floating search bar sits over the top of the screen
   * (Explore; not Nearby), so a full-screen panel starts below it
   */
  searchBar?: boolean;
}

/**
 * The phone panel for Explore pages (stop, route, trip, search, saved) and
 * Nearby.
 * Opens at most half height, and only as tall as its content, so the map
 * stays in view. Tap the grab handle on top to grow it (or shrink it back
 * from full screen), drag the handle or the title row below it up or
 * down, or use the arrow keys on the handle. Collapsed, it keeps the
 * page's title row in view.
 */
export const MobileMenuPanel = ({
  children,
  innerRef,
  searchBar = true,
}: PropsWithChildren<MobileMenuPanelProps>) => {
  const [size, setSize] = useState<SheetSize>("half");
  const [dragHeight, setDragHeight] = useState<number>();
  const drag = useRef<Drag>();
  const paper = useRef<HTMLDivElement | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  const content = useRef<HTMLDivElement | null>(null);
  const handle = useRef<HTMLButtonElement | null>(null);
  const contentHeight = useContentHeight(content);
  // Room left above a full-screen panel for the search bar
  const fullTop = searchBar ? PHONE_SEARCH_BAR_HEIGHT : 0;

  // Keep the browser from turning a drag on the panel's top strip into its
  // own gesture (pull-to-refresh, page scroll). React's touch listeners are
  // passive, so this needs a native one.
  useEffect(() => {
    const element = paper.current;
    if (!element) return;
    const hold = (event: TouchEvent) => {
      if (drag.current) event.preventDefault();
    };
    element.addEventListener("touchmove", hold, { passive: false });
    return () => element.removeEventListener("touchmove", hold);
  }, []);

  // A half panel shrinks to fit short content
  const fitted =
    contentHeight === undefined
      ? undefined
      : contentHeight + PHONE_SHEET_HANDLE_HEIGHT;

  // Let the map frame targets above the panel at its current size
  useEffect(() => {
    setPhoneSheetSize(
      size,
      size === "half" && fitted !== undefined
        ? Math.round(Math.min(fitted, halfHeightPx()))
        : undefined
    );
  }, [size, fitted]);
  useEffect(() => () => setPhoneSheetSize("half"), []);

  // Collapsed shows the top of the page (its title)
  useEffect(() => {
    if (size === "collapsed") scroller.current?.scrollTo?.({ top: 0 });
  }, [size]);

  const step = (by: number) =>
    setSize((current) => SIZES[SIZES.indexOf(current) + by] ?? current);
  const tap = () =>
    setSize((current) => (current === "half" ? "full" : "half"));

  const height =
    dragHeight !== undefined
      ? `${dragHeight}px`
      : size === "collapsed"
        ? `${PHONE_SHEET_COLLAPSED_HEIGHT}px`
        : size === "full"
          ? `calc(100vh - ${BOTTOM_TABS_HEIGHT}px)`
          : fitted === undefined
            ? `${PHONE_SHEET_HEIGHT_VH}vh`
            : `min(${fitted}px, ${PHONE_SHEET_HEIGHT_VH}vh)`;

  /**
   * Whether a press here can drag the panel: the handle, or the page's
   * title row below it while the page is scrolled to the top (taps on its
   * buttons still work; text fields never drag)
   */
  const inDragStrip = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target as Element;
    if (handle.current?.contains(target)) return true;
    if (target.closest?.("input, textarea, select, [contenteditable]")) {
      return false;
    }
    if ((scroller.current?.scrollTop ?? 0) > 0) return false;
    const top =
      (paper.current?.getBoundingClientRect().top ?? 0) +
      (size === "full" ? fullTop : 0);
    const offset = event.clientY - top;
    return offset >= 0 && offset <= PHONE_SHEET_COLLAPSED_HEIGHT;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    drag.current = undefined;
    if (!inDragStrip(event)) return;
    const target = event.target as Element;
    const onHandle = handle.current?.contains(target) ?? false;
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: paper.current?.getBoundingClientRect().height ?? 0,
      moved: false,
      onHandle,
    };
    // Keep the pointer even if it leaves the strip. Not yet on a button in
    // the title row, so a tap there still clicks it.
    if (onHandle || !target.closest?.("button, a, [role='button']")) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dy = event.clientY - current.startY;
    if (!current.moved && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
    if (!current.moved) {
      // A drag, not a tap: also take the pointer from a button it started
      // on, so letting go doesn't click it
      current.moved = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      // Moving the panel, not selecting its title
      window.getSelection?.()?.removeAllRanges();
    }
    setDragHeight(
      Math.min(
        fullHeightPx(),
        Math.max(PHONE_SHEET_COLLAPSED_HEIGHT, current.startHeight - dy)
      )
    );
  };

  const endDrag = (event: React.PointerEvent<HTMLElement>) => {
    const current = drag.current;
    drag.current = undefined;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.moved) {
      if (current.onHandle) tap();
      return;
    }
    setDragHeight(undefined);
    // Snap to the size nearest where the panel was let go
    const at = current.startHeight - (event.clientY - current.startY);
    const targets: [SheetSize, number][] = [
      ["collapsed", PHONE_SHEET_COLLAPSED_HEIGHT],
      ["half", Math.min(fitted ?? Infinity, halfHeightPx())],
      ["full", fullHeightPx()],
    ];
    const [nearest] = targets.reduce((best, target) =>
      Math.abs(target[1] - at) < Math.abs(best[1] - at) ? target : best
    );
    setSize(nearest);
  };

  // The browser took the gesture over: put the panel back where it was
  const cancelDrag = () => {
    drag.current = undefined;
    setDragHeight(undefined);
  };

  // Enter or Space on the handle (pointer taps end in endDrag)
  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    if (event.detail === 0) tap();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowUp") step(1);
    else if (event.key === "ArrowDown") step(-1);
    else return;
    event.preventDefault();
  };

  return (
    <Paper
      elevation={8}
      onPointerCancel={cancelDrag}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      ref={(element: HTMLDivElement | null) => {
        paper.current = element;
        if (innerRef) innerRef.current = element;
      }}
      sx={{
        height,
        width: "100vw",
        maxWidth: "100vw",
        overflow: "hidden",
        position: "fixed",
        // Sits above the phone tab bar
        bottom: BOTTOM_TABS_HEIGHT,
        left: 0,
        display: "flex",
        flexDirection: "column",
        // Full screen: the handle sits below the floating search bar
        pt: size === "full" ? `${fullTop}px` : 0,
        borderTopLeftRadius: size === "full" ? 0 : 16,
        borderTopRightRadius: size === "full" ? 0 : 16,
        userSelect: dragHeight === undefined ? undefined : "none",
        // Follow the finger while dragging; animate snaps
        transition:
          dragHeight === undefined ? "height 0.3s ease-in-out" : "none",
        zIndex: 1000,
      }}
    >
      <Box
        aria-expanded={size !== "collapsed"}
        aria-keyshortcuts={"ArrowUp ArrowDown"}
        aria-label={size === "full" ? "Collapse menu" : "Expand menu"}
        component={"button"}
        onClick={onClick}
        onKeyDown={onKeyDown}
        ref={handle}
        sx={{
          alignItems: "center",
          bgcolor: "transparent",
          border: 0,
          cursor: "grab",
          display: "flex",
          flexShrink: 0,
          height: PHONE_SHEET_HANDLE_HEIGHT,
          justifyContent: "center",
          p: 0,
          // Drags resize the panel instead of scrolling the page
          touchAction: "none",
          width: "100%",
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: -2,
          },
        }}
        title={
          size === "full"
            ? "Drag or tap to show the map"
            : "Drag or tap to resize"
        }
        type={"button"}
      >
        <Box
          sx={{
            bgcolor: "text.disabled",
            borderRadius: 2,
            height: 4,
            width: 36,
          }}
        />
      </Box>
      <Slide
        direction={"right"}
        in={true}
        mountOnEnter={true}
        unmountOnExit={true}
      >
        <Box
          component={"div"}
          ref={scroller}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: size === "collapsed" ? "hidden" : "auto",
          }}
        >
          <Box ref={content}>{children}</Box>
        </Box>
      </Slide>
    </Paper>
  );
};
