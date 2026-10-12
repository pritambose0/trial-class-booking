import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatSlotLabel,
  formatTimeInZone,
  isValidTimeZone,
  istBusinessWindowForDate,
  istBusinessWindowForInstant,
  istMinutesSinceDayOpen,
  parseStartTime,
} from "../src/utils/time.js";
import { IST_ZONE } from "../src/constants.js";

test("isValidTimeZone accepts IANA zones and rejects junk", () => {
  assert.equal(isValidTimeZone("America/New_York"), true);
  assert.equal(isValidTimeZone("Europe/London"), true);
  assert.equal(isValidTimeZone("Asia/Kolkata"), true);
  assert.equal(isValidTimeZone("Mars/Phobos"), false);
  assert.equal(isValidTimeZone(""), false);
});

test("parseStartTime keeps the instant when the string carries an offset", () => {
  const value = parseStartTime("2026-10-20T03:30:00.000Z", "America/New_York");
  assert.equal(value.toISOString(), "2026-10-20T03:30:00.000Z");
});

test("parseStartTime treats a naive string as wall-clock in the given zone", () => {
  // 20 Oct 2026 is still EDT (UTC-4), so 09:00 local => 13:00Z.
  const value = parseStartTime("2026-10-20T09:00:00", "America/New_York");
  assert.equal(value.toISOString(), "2026-10-20T13:00:00.000Z");
});

test("parseStartTime is DST-aware across the US spring-forward", () => {
  const beforeDst = parseStartTime("2026-03-03T09:00:00", "America/New_York");
  const afterDst = parseStartTime("2026-03-10T09:00:00", "America/New_York");

  assert.equal(beforeDst.toISOString(), "2026-03-03T14:00:00.000Z"); // EST, UTC-5
  assert.equal(afterDst.toISOString(), "2026-03-10T13:00:00.000Z"); // EDT, UTC-4
});

test("parseStartTime resolves the same wall-clock across the UK DST shift", () => {
  const winter = parseStartTime("2026-01-15T09:00:00", "Europe/London");
  const summer = parseStartTime("2026-07-15T09:00:00", "Europe/London");

  assert.equal(winter.toISOString(), "2026-01-15T09:00:00.000Z"); // GMT
  assert.equal(summer.toISOString(), "2026-07-15T08:00:00.000Z"); // BST, UTC+1
});

test("parseStartTime rejects unparseable input", () => {
  assert.throws(
    () => parseStartTime("not-a-date", "America/New_York"),
    /Invalid start time/,
  );
});

test("istBusinessWindowForDate returns the 09:00-18:00 IST window", () => {
  const { dayOpen, dayClose } = istBusinessWindowForDate("2026-10-12");
  assert.equal(dayOpen.toISOString(), "2026-10-12T03:30:00.000Z"); // 09:00 IST
  assert.equal(dayClose.toISOString(), "2026-10-12T12:30:00.000Z"); // 18:00 IST
});

test("istBusinessWindowForInstant maps an instant to its IST day window", () => {
  // 2026-10-11T22:00Z is 2026-10-12 03:30 IST, i.e. the 12th in IST.
  const { dayOpen, dayClose } = istBusinessWindowForInstant(
    new Date("2026-10-11T22:00:00.000Z"),
  );
  assert.equal(dayOpen.toISOString(), "2026-10-12T03:30:00.000Z");
  assert.equal(dayClose.toISOString(), "2026-10-12T12:30:00.000Z");
});

test("istMinutesSinceDayOpen counts 30-minute boundaries", () => {
  assert.equal(istMinutesSinceDayOpen(new Date("2026-10-12T03:30:00.000Z")), 0);
  assert.equal(istMinutesSinceDayOpen(new Date("2026-10-12T03:45:00.000Z")), 15);
  assert.equal(istMinutesSinceDayOpen(new Date("2026-10-12T04:00:00.000Z")), 30);
});

test("formatTimeInZone and formatSlotLabel render the slot", () => {
  const start = new Date("2026-10-12T03:30:00.000Z");
  const end = new Date("2026-10-12T04:00:00.000Z");

  assert.match(formatTimeInZone(start, IST_ZONE), /9:00/);
  assert.match(formatSlotLabel(start, end, IST_ZONE), /9:00/);
});
