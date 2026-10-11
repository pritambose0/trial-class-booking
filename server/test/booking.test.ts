import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createBookingSchema,
  getAvailabilitySchema,
} from "../src/validators/booking.validator.js";
import { Booking } from "../src/models/booking.model.js";

test("createBookingSchema accepts a booking without a mentor (auto-assign)", () => {
  const parsed = createBookingSchema.parse({
    parentName: "Jane Doe",
    parentEmail: "Jane@Example.com",
    childAge: 9,
    timezone: "America/New_York",
    startsAt: "2026-10-20T09:00:00",
  });

  assert.equal(parsed.mentor, undefined);
  assert.equal(parsed.parentEmail, "jane@example.com");
});

test("createBookingSchema accepts a valid explicit mentor id", () => {
  const result = createBookingSchema.safeParse({
    mentor: "6512f1c2a3b4c5d6e7f8091a",
    parentName: "Jane Doe",
    parentEmail: "jane@example.com",
    timezone: "Europe/London",
    startsAt: "2026-10-20T09:00:00",
  });
  assert.equal(result.success, true);
});

test("createBookingSchema rejects a malformed mentor id", () => {
  const result = createBookingSchema.safeParse({
    mentor: "not-an-object-id",
    parentName: "Jane Doe",
    parentEmail: "jane@example.com",
    timezone: "Europe/London",
    startsAt: "2026-10-20T09:00:00",
  });
  assert.equal(result.success, false);
});

test("createBookingSchema rejects an unknown timezone", () => {
  const result = createBookingSchema.safeParse({
    parentName: "Jane Doe",
    parentEmail: "jane@example.com",
    timezone: "Mars/Phobos",
    startsAt: "2026-10-20T09:00:00",
  });
  assert.equal(result.success, false);
});

test("createBookingSchema rejects an unparseable start time", () => {
  const result = createBookingSchema.safeParse({
    parentName: "Jane Doe",
    parentEmail: "jane@example.com",
    timezone: "America/New_York",
    startsAt: "nope",
  });
  assert.equal(result.success, false);
});

test("getAvailabilitySchema requires a real YYYY-MM-DD date", () => {
  assert.equal(
    getAvailabilitySchema.safeParse({ date: "2026-10-12" }).success,
    true,
  );
  assert.equal(
    getAvailabilitySchema.safeParse({ date: "10/12/2026" }).success,
    false,
  );
  assert.equal(
    getAvailabilitySchema.safeParse({ date: "2026-13-40" }).success,
    false,
  );
});

test("booking schema enforces a unique slot per mentor", () => {
  const hasUniqueSlotIndex = Booking.schema
    .indexes()
    .some(
      ([keys, options]) =>
        options?.unique === true &&
        keys.mentor === 1 &&
        keys.startsAt === 1,
    );

  assert.equal(hasUniqueSlotIndex, true);
});

test("booking schema requires the parent timezone", () => {
  assert.equal(Booking.schema.path("timezone").isRequired, true);
});
