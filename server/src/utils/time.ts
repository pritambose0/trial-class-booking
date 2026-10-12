import { DateTime, IANAZone } from "luxon";
import { ApiError } from "./ApiError.js";
import {
  IST_DAY_END_HOUR,
  IST_DAY_START_HOUR,
  IST_ZONE,
} from "../constants.js";

export const isValidTimeZone = (timezone: string): boolean =>
  IANAZone.isValidZone(timezone);

/**
 * Parses a start timestamp with DST-aware resolution.
 *
 * Accepts an ISO datetime string:
 *  - with an offset (e.g. "2026-11-01T13:30:00-04:00" or "...Z") → the instant
 *    encoded by that offset is used as-is;
 *  - naive (e.g. "2026-11-01T09:30:00") → interpreted as wall-clock time in the
 *    caller's `timezone`, resolving to the correct UTC instant across DST
 *    gaps/overlaps via luxon.
 */
export const parseStartTime = (startsAt: string, timezone: string): Date => {
  const dt = DateTime.fromISO(startsAt, { zone: timezone });

  if (!dt.isValid) {
    throw new ApiError(
      422,
      `Invalid start time "${startsAt}": ${dt.invalidReason ?? "unparseable"}`,
    );
  }

  return dt.toUTC().toJSDate();
};

// The IST business-hour window (09:00–18:00 IST) for a given IST calendar day.
export const istBusinessWindowForDate = (date: string): { dayOpen: Date; dayClose: Date } => {
  const dayStart = DateTime.fromISO(`${date}T00:00:00`, { zone: IST_ZONE });

  return {
    dayOpen: dayStart.plus({ hours: IST_DAY_START_HOUR }).toUTC().toJSDate(),
    dayClose: dayStart.plus({ hours: IST_DAY_END_HOUR }).toUTC().toJSDate(),
  };
};

// The IST business-hour window for the IST day that contains `instant`.
export const istBusinessWindowForInstant = (instant: Date): { dayOpen: Date; dayClose: Date } => {
  const ist = DateTime.fromJSDate(instant).setZone(IST_ZONE);
  const dayStart = ist.startOf("day");

  return {
    dayOpen: dayStart.plus({ hours: IST_DAY_START_HOUR }).toUTC().toJSDate(),
    dayClose: dayStart.plus({ hours: IST_DAY_END_HOUR }).toUTC().toJSDate(),
  };
};

// Minutes since that IST day's 09:00 opening boundary, for a given instant.
export const istMinutesSinceDayOpen = (instant: Date): number => {
  const ist = DateTime.fromJSDate(instant).setZone(IST_ZONE);
  const dayOpen = ist.startOf("day").plus({ hours: IST_DAY_START_HOUR });
  return ist.diff(dayOpen, "minutes").minutes;
};

export const formatInZone = (date: Date, timezone: string): string =>
  DateTime.fromJSDate(date).setZone(timezone).toLocaleString(DateTime.DATETIME_MED);

export const formatDateInZone = (date: Date, timezone: string): string =>
  DateTime.fromJSDate(date).setZone(timezone).toLocaleString(DateTime.DATE_FULL);

export const formatTimeInZone = (date: Date, timezone: string): string =>
  DateTime.fromJSDate(date).setZone(timezone).toLocaleString(DateTime.TIME_SIMPLE);

export const formatSlotLabel = (
  startsAt: Date,
  endsAt: Date,
  timezone: string,
): string => {
  const date = formatDateInZone(startsAt, timezone);
  const start = formatTimeInZone(startsAt, timezone);
  const end = formatTimeInZone(endsAt, timezone);
  return `${date} \u2022 ${start} \u2013 ${end}`;
};