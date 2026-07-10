import { useCallback, useRef } from "react";

/**
 * Delayed-close timer for hover popups. Closing is scheduled when the pointer
 * leaves a map feature and cancelled when it re-enters the feature or the
 * popup, so the popup survives the mouse travelling across the gap between
 * them.
 *
 * `onClose` must be referentially stable (e.g. wrapped in useCallback) so the
 * returned handlers stay stable across renders.
 */
export const useHoverClose = (onClose: () => void, delayMs = 200) => {
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(onClose, delayMs);
  }, [onClose, delayMs]);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  return { scheduleClose, cancelClose };
};
