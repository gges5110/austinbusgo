import { useEffect, useRef, useState } from "react";
import { useUpcomingAtStop } from "shared/api/generated/api";

/** Matches the edge cache's real-time TTL */
export const UPCOMING_REFRESH_MS = 15000;

/**
 * Upcoming arrivals at a stop, refreshed every 15s while the page is visible
 * (react-query pauses interval refetches for hidden tabs and refetches on
 * focus). `clockOffset` = server time − device time, in seconds.
 */
export const useUpcoming = (stopId?: string) => {
  const query = useUpcomingAtStop(stopId ?? "", {
    query: {
      enabled: !!stopId,
      refetchInterval: UPCOMING_REFRESH_MS,
      refetchOnWindowFocus: true,
      keepPreviousData: true,
      // Unknown stops 404; retrying won't help
      retry: (failureCount, error) =>
        !String(error).includes(" 404 ") && failureCount < 2,
    },
  });

  const [clockOffset, setClockOffset] = useState(0);
  const data = query.data;
  useEffect(() => {
    if (data) {
      setClockOffset(data.generatedAt - Date.now() / 1000);
    }
  }, [data]);

  return { ...query, clockOffset };
};

/**
 * Server-corrected "now" in epoch seconds, re-rendering every second so
 * countdowns and "updated N s ago" stay live between fetches.
 */
export const useServerNow = (clockOffset: number) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const offsetRef = useRef(clockOffset);
  offsetRef.current = clockOffset;
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return nowMs / 1000 + offsetRef.current;
};
