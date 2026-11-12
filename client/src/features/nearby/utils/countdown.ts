import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { UpcomingArrival } from "shared/api/generated/model";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Schedules are Austin service days; show Austin time on any device */
export const TRANSIT_TIME_ZONE = "America/Chicago";
const transitTime = (epochSeconds: number) =>
  dayjs.unix(epochSeconds).tz(TRANSIT_TIME_ZONE);

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
 * "640 Forty Acres-OB OB" → "Forty Acres OB".
 */
export const formatHeadsign = (headsign?: string | null, routeId?: string) => {
  if (!headsign) return "";
  let name = headsign.trim();
  // Only a whole leading route number ("801 …", "801-…"), not "3rd Street"
  if (
    routeId &&
    name.startsWith(routeId) &&
    /^[\s-]/.test(name.slice(routeId.length))
  ) {
    name = name.slice(routeId.length).replace(/^[\s-]+/, "");
  }
  // The UT shuttles repeat their direction code: "Forty Acres-OB OB"
  return name.replace(/-([A-Z]+)\s+\1$/i, " $1").trim();
};

/** "5:42 AM" */
export const formatClockTime = (epochSeconds: number) =>
  transitTime(epochSeconds).format("h:mm A");

/**
 * When a later bus comes, with the day if it isn't today: "at 5:42 AM",
 * "tomorrow at 5:42 AM", "Thursday at 10:22 AM", "Thu, Dec 3 at 10:22 AM".
 */
export const formatNextBusTime = (epochSeconds: number, nowSeconds: number) => {
  const at = transitTime(epochSeconds);
  const days = at
    .startOf("day")
    .diff(transitTime(nowSeconds).startOf("day"), "day");
  const time = `at ${at.format("h:mm A")}`;
  if (days <= 0) return time;
  if (days === 1) return `tomorrow ${time}`;
  if (days < 7) return `${at.format("dddd")} ${time}`;
  return `${at.format("ddd, MMM D")} ${time}`;
};
