import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { DateTime } from "luxon";
import { Booking } from "../../src/models/booking.model.js";
import { Mentor } from "../../src/models/mentor.model.js";
import { bootstrapMentors } from "../../src/scripts/bootstrapMentors.js";
import {
  getAvailableSlots,
  createBooking,
} from "../../src/services/booking.service.js";
import { istBusinessWindowForDate } from "../../src/utils/time.js";
import { ApiError } from "../../src/utils/ApiError.js";
import type {
  CreateBookingInput,
  GetAvailabilityInput,
} from "../../src/validators/booking.validator.js";

// These tests need a real, transaction-capable MongoDB (a replica set) because
// booking creation runs inside a transaction. They are intentionally kept out
// of the default `npm test` glob and run via `npm run test:integration`.

const IST = "Asia/Kolkata";
const SLOT_MS = 30 * 60 * 1000;

// A future IST day that sits safely inside the 30-day booking window.
const targetDate = DateTime.now().setZone(IST).plus({ days: 3 }).toISODate();
if (!targetDate) {
  throw new Error("Could not resolve an IST target date for integration tests");
}

let mentors: { _id: mongoose.Types.ObjectId }[];

const seededBooking = (mentor: mongoose.Types.ObjectId, startsAt: Date) => ({
  mentor,
  parentName: "Seed Parent",
  parentEmail: "seed@example.com",
  timezone: IST,
  startsAt,
  endsAt: new Date(startsAt.getTime() + SLOT_MS),
  status: "confirmed" as const,
});

const expectConflict = (error: unknown): boolean =>
  error instanceof ApiError && error.statusCode === 409;

before(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI must be set to run the integration tests");
  }

  const dbName =
    process.env.MONGODB_TEST_DB_NAME ?? "trial-class-booking-integration-test";
  await mongoose.connect(uri, {
    dbName,
    // Fail fast when no replica set is reachable instead of hanging for 30s.
    serverSelectionTimeoutMS: 5000,
  });

  // Never let a misconfigured URI drop data from a real database.
  if (!/test/i.test(mongoose.connection.name)) {
    throw new Error(
      `Refusing to run destructive integration tests against "${mongoose.connection.name}": the database name must contain "test"`,
    );
  }

  await Booking.init();
  await Mentor.init();

  await Booking.deleteMany({});
  await Mentor.deleteMany({});
  await bootstrapMentors();

  mentors = (await Mentor.find({})
    .select("_id")
    .lean()) as unknown as { _id: mongoose.Types.ObjectId }[];

  assert.equal(mentors.length, 10, "expected the 10-mentor roster");
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  await Booking.deleteMany({});
});

after(async () => {
  if (mongoose.connection.readyState !== 1) return;
  await Booking.deleteMany({});
  await mongoose.disconnect();
});

test("a fully booked IST day reports zero availability and rejects the next booking with 409", async () => {
  assert.equal(
    mongoose.connection.readyState,
    1,
    "MongoDB must be connected to run integration tests",
  );
  const { dayOpen } = istBusinessWindowForDate(targetDate);

  // Two confirmed classes per mentor (09:00 + 09:30 IST) => every mentor hits
  // the daily cap, so no mentor can take any slot for the rest of the day.
  const start0 = new Date(dayOpen.getTime());
  const start1 = new Date(dayOpen.getTime() + SLOT_MS);

  await Booking.insertMany(
    mentors.flatMap((mentor) => [
      seededBooking(mentor._id, start0),
      seededBooking(mentor._id, start1),
    ]),
  );

  const availability = await getAvailableSlots({
    date: targetDate,
    timezone: IST,
  } satisfies GetAvailabilityInput);

  assert.equal(availability.remainingSlots, 0);
  assert.ok(availability.slots.length > 0, "expected slots for the day");
  assert.ok(
    availability.slots.every((slot) => slot.available === false),
    "every slot should be unavailable once all mentors reach their daily cap",
  );

  await assert.rejects(
    createBooking({
      parentName: "Late Parent",
      parentEmail: "late@example.com",
      timezone: IST,
      startsAt: start0.toISOString(),
    } satisfies CreateBookingInput),
    expectConflict,
  );
});

test("filling one slot across all mentors blocks only that slot", async () => {
  assert.equal(
    mongoose.connection.readyState,
    1,
    "MongoDB must be connected to run integration tests",
  );
  const { dayOpen } = istBusinessWindowForDate(targetDate);

  // One booking per mentor at 09:00 IST => all 10 mentors busy at that instant,
  // while the rest of the day remains open (nobody is at their cap yet).
  const start0 = new Date(dayOpen.getTime());

  await Booking.insertMany(
    mentors.map((mentor) => seededBooking(mentor._id, start0)),
  );

  const availability = await getAvailableSlots({
    date: targetDate,
    timezone: IST,
  } satisfies GetAvailabilityInput);

  const [first, second] = availability.slots;
  assert.equal(first.startsAt, start0.toISOString());
  assert.equal(first.available, false, "09:00 IST should be fully booked");
  assert.equal(second.available, true, "09:30 IST should still be open");

  await assert.rejects(
    createBooking({
      parentName: "Late Parent",
      parentEmail: "late@example.com",
      timezone: IST,
      startsAt: start0.toISOString(),
    } satisfies CreateBookingInput),
    expectConflict,
  );
});
