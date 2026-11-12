import dayjs from "dayjs";
import { UpcomingArrival } from "shared/api/generated/model";

/** When the bus is expected: the live prediction if any, else the schedule. */
export const effectiveAt = (arrival: UpcomingArrival) =>
  arrival.predictedAt ?? arrival.scheduledAt;

/**
 * Whole minutes until `epochSeconds`, never negative. `nowSeconds` should be
 * server-corrected (see useServerNow) so a phone with a wrong clock still
 * shows the right countdown.
 */
export const minutesUntil = (epochSeconds: number, nowSeconds: number) =>
  Math.max(0, Math.floor((epochSeconds - nowSeconds) / 60));

/** "Arriving" or "6 min". */
export const countdownLabel = (
  arrival: UpcomingArrival,
  nowSeconds: number
) => {
  const minutes = minutesUntil(effectiveAt(arrival), nowSeconds);
  if (arrival.status === "arriving" || minutes === 0) {
    return "Arriving";
  }
  return `${minutes} min`;
};

/** "3 stops away" / "Next stop" / "Scheduled" */
export const distanceLabel = (arrival: UpcomingArrival) => {
  if (arrival.stopsAway === null || arrival.stopsAway === undefined) {
    return arrival.predictedAt ? "Live" : "Scheduled";
  }
  if (arrival.stopsAway === 0) return "Next stop";
  if (arrival.stopsAway === 1) return "1 stop away";
  return `${arrival.stopsAway} stops away`;
};

/**
 * CapMetro headsigns repeat the route ("801-Tech Ridge Park & Ride NB" or
 * "801 Tech Ridge…"); keep the destination, like the stop page does.
 */
export const formatHeadsign = (headsign?: string | null, routeId?: string) => {
  if (!headsign) return "";
  const afterDash = headsign.split("-").pop() ?? headsign;
  const withoutRoute =
    routeId && afterDash.startsWith(`${routeId} `)
      ? afterDash.slice(routeId.length + 1)
      : afterDash;
  return withoutRoute.trim();
};

/** "5:42 AM" */
export const formatClockTime = (epochSeconds: number) =>
  dayjs.unix(epochSeconds).format("h:mm A");

/**
 * When a later bus comes, with the day if it isn't today: "at 5:42 AM",
 * "tomorrow at 5:42 AM", "Thursday at 10:22 AM", "Thu, Dec 3 at 10:22 AM".
 */
export const formatNextBusTime = (epochSeconds: number, nowSeconds: number) => {
  const at = dayjs.unix(epochSeconds);
  const days = at
    .startOf("day")
    .diff(dayjs.unix(nowSeconds).startOf("day"), "day");
  const time = `at ${at.format("h:mm A")}`;
  if (days <= 0) return time;
  if (days === 1) return `tomorrow ${time}`;
  if (days < 7) return `${at.format("dddd")} ${time}`;
  return `${at.format("ddd, MMM D")} ${time}`;
};
