export const IST_ZONE = "Asia/Kolkata";

export const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
];

// Best-effort detection of the visitor's IANA timezone.
export const detectTimeZone = (): string => {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
    );
  } catch {
    return "America/New_York";
  }
};

// The calendar date (YYYY-MM-DD) of an instant in a given timezone.
export const zonedDateKey = (iso: string | Date, timeZone: string): string => {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

// Add `days` to a YYYY-MM-DD key (timezone-agnostic calendar arithmetic).
export const addDays = (dateKey: string, days: number): string => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const formatTime = (iso: string | Date, timeZone: string): string =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(typeof iso === "string" ? new Date(iso) : iso);

export const formatDayShort = (iso: string | Date, timeZone: string): string =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(typeof iso === "string" ? new Date(iso) : iso);

export const formatFullDateTime = (iso: string, timeZone: string): string =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

// A friendly relative label: "Today", "Tomorrow", else the short date.
export const relativeDayLabel = (dateKey: string, todayKey: string): string => {
  if (dateKey === todayKey) return "Today";
  if (dateKey === addDays(todayKey, 1)) return "Tomorrow";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
};
