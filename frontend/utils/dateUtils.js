import { utcToZonedTime, format } from "date-fns-tz";

const CST = "America/Chicago";

/**
 * Convert JS Date or date string to YYYY-MM-DD in CST timezone.
 */
export const toCSTDateString = (date) => {
  if (!date) return null;

  const parsed = typeof date === "string" ? new Date(date) : date;
  const zoned = utcToZonedTime(parsed, CST);

  return format(zoned, "yyyy-MM-dd");
};
