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
}

interface MobileMenuPanelProps {
  innerRef?: React.MutableRefObject<HTMLDivElement | null>;
}

/**
 * The phone panel for Explore pages (stop, route, trip, search, saved).
 * Opens at most half height, and only as tall as its content, so the map
 * stays in view. A grab handle on top resizes it: tap to grow (or shrink
 * back from full screen), drag up or down, or use the arrow keys.
 * Collapsed, it keeps the page's title row in view.
 */
export const MobileMenuPanel = ({
  children,
  innerRef,
}: PropsWithChildren<MobileMenuPanelProps>) => {
  const [size, setSize] = useState<SheetSize>("half");
  const [dragHeight, setDragHeight] = useState<number>();
  const drag = useRef<Drag>();
  const dragged = useRef(false);
  const paper = useRef<HTMLDivElement | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  const content = useRef<HTMLDivElement | null>(null);
  const contentHeight = useContentHeight(content);

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

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: paper.current?.getBoundingClientRect().height ?? 0,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dy = event.clientY - current.startY;
    if (!current.moved && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
    current.moved = true;
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
    dragged.current = current.moved;
    if (!current.moved) return;
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

  const onClick = () => {
    // The click that ends a drag isn't a tap
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    tap();
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
        pt: size === "full" ? `${PHONE_SEARCH_BAR_HEIGHT}px` : 0,
        borderTopLeftRadius: size === "full" ? 0 : 16,
        borderTopRightRadius: size === "full" ? 0 : 16,
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
        onPointerCancel={endDrag}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
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
