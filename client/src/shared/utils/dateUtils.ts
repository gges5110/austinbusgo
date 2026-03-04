import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isBetween from "dayjs/plugin/isBetween";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(LocalizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);
export const getDate = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    ("0" + (d.getMonth() + 1)).slice(-2),
    ("0" + d.getDate()).slice(-2),
  ].join("");
};

export const getTime = () => {
  const d = new Date();
  return [
    ("0" + d.getHours()).slice(-2),
    ("0" + d.getMinutes()).slice(-2),
    "00",
  ].join(":");
};

// Parse an HH:mm:ss arrival time string into a Dayjs object.
// Handles midnight-crossing: if the parsed time appears >12h in the past,
// it is treated as belonging to the next day (e.g. "00:05:00" at 23:55).
export const parseArrivalTime = (timeStr: string) => {
  const t = dayjs(timeStr, "HH:mm:ss");
  if (dayjs().diff(t, "hour") > 12) {
    return t.add(1, "day");
  }
  return t;
};
