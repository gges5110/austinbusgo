import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useHoverClose } from "./useHoverClose";

describe("useHoverClose", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("calls onClose after the delay when a close is scheduled", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useHoverClose(onClose, 200));

    act(() => {
      result.current.scheduleClose();
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("cancelClose prevents a scheduled close", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useHoverClose(onClose, 200));

    act(() => {
      result.current.scheduleClose();
      result.current.cancelClose();
      vi.advanceTimersByTime(500);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  test("cancelClose is a no-op when nothing is scheduled", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useHoverClose(onClose));

    expect(() => {
      act(() => {
        result.current.cancelClose();
      });
    }).not.toThrow();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("handlers are referentially stable across renders", () => {
    const onClose = vi.fn();
    const { result, rerender } = renderHook(() => useHoverClose(onClose));

    const first = result.current;
    rerender();

    expect(result.current.scheduleClose).toBe(first.scheduleClose);
    expect(result.current.cancelClose).toBe(first.cancelClose);
  });
});
