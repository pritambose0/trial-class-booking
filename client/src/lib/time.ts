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

// A compact GMT offset for a zone, e.g. "GMT-4" or "GMT+5:30".
export const zoneOffsetLabel = (
  timeZone: string,
  at: Date = new Date(),
): string => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(at);
    return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
};

// A parent-friendly zone label, e.g. "New York (GMT-4)".
export const formatZoneLabel = (timeZone: string): string => {
  const city =
    timeZone.split("/").pop()?.replace(/_/g, " ") || "your timezone";
  const offset = zoneOffsetLabel(timeZone);
  return offset ? `${city} (${offset})` : city;
};

const SUPPORTED_ZONES: string[] | null = (() => {
  try {
    const supported = (
      Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf;
    const zones = typeof supported === "function" ? supported("timeZone") : null;
    return zones && zones.length > 0 ? zones : null;
  } catch {
    return null;
  }
})();

export interface TimezoneGroups {
  common: string[];
  all: string[];
}

// The visitor's detected zone plus a curated shortlist, backed by the full IANA
// database when the browser exposes it.
export const getTimezoneGroups = (current: string): TimezoneGroups => {
  const commonSet = new Set(COMMON_TIMEZONES);
  if (current) commonSet.add(current);

  const common = Array.from(commonSet).sort((a, b) =>
    a.localeCompare(b),
  );

  const all = (SUPPORTED_ZONES ?? COMMON_TIMEZONES)
    .filter((zone) => !commonSet.has(zone))
    .sort((a, b) => a.localeCompare(b));

  return { common, all };
};
