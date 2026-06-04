export const WEEKDAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export const defaultDayHours = () => ({
  open: true,
  start: "09:00",
  end: "22:00",
});

export function parseOpeningHours(raw) {
  if (!raw || typeof raw !== "string") {
    return Object.fromEntries(WEEKDAYS.map((d) => [d.key, defaultDayHours()]));
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return Object.fromEntries(
        WEEKDAYS.map((d) => [
          d.key,
          {
            open: parsed[d.key]?.open !== false,
            start: parsed[d.key]?.start || "09:00",
            end: parsed[d.key]?.end || "22:00",
          },
        ])
      );
    }
  } catch {
    /* legacy plain text */
  }
  return Object.fromEntries(WEEKDAYS.map((d) => [d.key, defaultDayHours()]));
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** Whether `date` falls inside today's configured hours (local time). */
export function isOpenByHours(hours, date = new Date()) {
  const dayKey = DAY_KEYS[date.getDay()];
  const row = hours?.[dayKey];
  if (!row || row.open === false) return false;

  const start = parseTimeToMinutes(row.start);
  let end = parseTimeToMinutes(row.end);
  const now = date.getHours() * 60 + date.getMinutes();

  if (start === null || end === null) return true;

  if (end <= start) {
    return now >= start || now < end;
  }

  return now >= start && now < end;
}

/** open | closed from schedule only */
export function statusFromHours(hours, date = new Date()) {
  return isOpenByHours(hours, date) ? "open" : "closed";
}

/**
 * When auto-following hours: closed if outside hours; keeps busy during open hours if set.
 */
export function resolveStatusWithHours(hours, currentStatus, date = new Date()) {
  const schedule = statusFromHours(hours, date);
  if (schedule === "closed") return "closed";
  if (currentStatus === "busy") return "busy";
  return "open";
}

export function hoursStatusHint(hours, date = new Date()) {
  const dayKey = DAY_KEYS[date.getDay()];
  const row = hours?.[dayKey];
  const label = WEEKDAYS.find((d) => d.key === dayKey)?.label || "Today";

  if (!row || row.open === false) {
    return `${label} is marked closed in your hours.`;
  }

  const open = isOpenByHours(hours, date);
  if (open) {
    return `Within today's hours (${row.start}–${row.end}). Store can be open or busy.`;
  }
  return `Outside today's hours (${row.start}–${row.end}). Status should be closed.`;
}
