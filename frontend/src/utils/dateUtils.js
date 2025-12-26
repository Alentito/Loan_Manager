// src/utils/timezone.js

/**
 * Convert any JS Date (or now) to America/Chicago timezone equivalent as a Date object
 * @param {Date} date
 * @returns {Date}
 */
export function toCST(date = new Date()) {
  // Convert to CST string in ISO format
  const isoString = date.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // isoString comes as "MM/DD/YYYY, HH:MM:SS", parse it
  const [mdy, hms] = isoString.split(", ");
  const [month, day, year] = mdy.split("/").map((v) => v.padStart(2, "0"));
  const [hour, minute, second] = hms.split(":").map((v) => v.padStart(2, "0"));

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
}

/**
 * Format a Date or CST Date object to HH:MM:SS
 * @param {Date} date
 * @returns {string} HH:MM:SS
 */
export function formatCSTTime(date = new Date()) {
  const cstDate = toCST(date);
  const h = String(cstDate.getHours()).padStart(2, "0");
  const m = String(cstDate.getMinutes()).padStart(2, "0");
  const s = String(cstDate.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * Format a Date or CST Date object to YYYY-MM-DD HH:MM:SS
 * @param {Date} date
 * @returns {string}
 */
export function formatCSTFull(date = new Date()) {
  const cstDate = toCST(date);
  const yyyy = cstDate.getFullYear();
  const mm = String(cstDate.getMonth() + 1).padStart(2, "0");
  const dd = String(cstDate.getDate()).padStart(2, "0");
  const hh = String(cstDate.getHours()).padStart(2, "0");
  const min = String(cstDate.getMinutes()).padStart(2, "0");
  const ss = String(cstDate.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}
