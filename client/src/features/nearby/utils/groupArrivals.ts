import { effectiveAt } from "features/nearby/utils/countdown";
import { UpcomingArrival } from "shared/api/generated/model";

/** Later buses shown on a route's row ("then 18, 32 min") */
export const LATER_PER_ROUTE = 2;

export interface ArrivalGroup {
  /** The next bus on this route and destination */
  next: UpcomingArrival;
  /** The ones after it, soonest first, at most LATER_PER_ROUTE */
  later: UpcomingArrival[];
}

/**
 * One group per route and destination, so a busy stop reads as a short
 * list of routes rather than a long list of buses. Groups come in the
 * order of their next bus; buses by when they're expected (a live bus
 * running late can come after a scheduled one).
 */
export const groupArrivals = (arrivals: UpcomingArrival[]): ArrivalGroup[] => {
  const groups = new Map<string, UpcomingArrival[]>();
  for (const arrival of arrivals) {
    const key = `${arrival.routeId}|${arrival.headsign ?? ""}`;
    groups.set(key, [...(groups.get(key) ?? []), arrival]);
  }
  return [...groups.values()]
    .map((buses) => {
      const [next, ...later] = [...buses].sort(
        (a, b) => effectiveAt(a) - effectiveAt(b)
      );
      return { next, later: later.slice(0, LATER_PER_ROUTE) };
    })
    .sort((a, b) => effectiveAt(a.next) - effectiveAt(b.next));
};
