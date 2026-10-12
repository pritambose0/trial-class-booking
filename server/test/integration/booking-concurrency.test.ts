import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { DateTime } from "luxon";
import { Booking } from "../../src/models/booking.model.js";
import { Mentor } from "../../src/models/mentor.model.js";
import { bootstrapMentors } from "../../src/scripts/bootstrapMentors.js";
import { createBooking } from "../../src/services/booking.service.js";
import { normalizeError } from "../../src/middlewares/errorHandler.middleware.js";
import { istBusinessWindowForDate } from "../../src/utils/time.js";
import type { CreateBookingInput } from "../../src/validators/booking.validator.js";

// Proves the concurrency-safety claim in the README: two requests for the same
// mentor + slot at the same time must produce exactly one booking (HTTP 201) and
// one clean conflict (HTTP 409), never a 500 or a double booking.

const IST = "Asia/Kolkata";
const SLOT_MS = 30 * 60 * 1000;
const CONNECTED = "MongoDB must be connected to run integration tests";

// A future IST day, offset from the capacity suite's date so the two files can
// never touch the same bookings even if run out of order.
const targetDate = DateTime.now().setZone(IST).plus({ days: 4 }).toISODate();
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

// Asserts the race result and that the loser maps to a clean HTTP 409. The loser
// can legitimately surface either as a duplicate-key error (the unique
// `{ mentor, startsAt }` index rejected the insert) or as an ApiError 409 (the
// loser's transaction read a snapshot after the winner committed and saw the
// mentor as busy). `normalizeError` is exactly what the HTTP layer applies, so
// checking it here verifies the status the API would return.
const describeError = (error: unknown): string => {
  if (error instanceof Error) {
    const details = error as Error & {
      code?: unknown;
      errorLabels?: unknown;
    };
    return `${details.name} code=${String(details.code)} labels=${JSON.stringify(
      details.errorLabels,
    )} message=${details.message}`;
  }
  return JSON.stringify(error);
};

const assertRaceResolved = (results: PromiseSettledResult<unknown>[]) => {
  const fulfilled = results.filter((result) => result.status === "fulfilled");
  const rejected = results.filter((result) => result.status === "rejected");

  assert.equal(fulfilled.length, 1, "exactly one booking must succeed (201)");
  assert.equal(rejected.length, 1, "exactly one booking must lose the race");

  const loser = (rejected[0] as PromiseRejectedResult).reason;
  const status = normalizeError(loser).statusCode;
  assert.equal(
    status,
    409,
    `the losing request must map to a clean 409, not a ${status} [${describeError(loser)}]`,
  );
};

before(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI must be set to run the integration tests");
  }

  const dbName =
    process.env.MONGODB_TEST_DB_NAME ?? "trial-class-booking-integration-test";
  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 5000,
  });

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

test("two simultaneous requests for the same mentor + slot yield one 201 and one 409", async () => {
  assert.equal(mongoose.connection.readyState, 1, CONNECTED);

  const { dayOpen } = istBusinessWindowForDate(targetDate);
  const startsAt = new Date(dayOpen.getTime() + SLOT_MS).toISOString(); // 09:30 IST
  const mentor = mentors[0]._id.toString();

  const book = (name: string): Promise<unknown> =>
    createBooking({
      mentor,
      parentName: name,
      parentEmail: `${name.toLowerCase()}@example.com`,
      timezone: IST,
      startsAt,
    } satisfies CreateBookingInput);

  const results = await Promise.allSettled([book("RaceOne"), book("RaceTwo")]);

  assertRaceResolved(results);

  const stored = await Booking.find({
    mentor: mentors[0]._id,
    startsAt: new Date(startsAt),
  }).lean();
  assert.equal(stored.length, 1, "the slot must be persisted exactly once");
});

test("concurrent auto-assign requests collide on the last free mentor without double-booking", async () => {
  assert.equal(mongoose.connection.readyState, 1, CONNECTED);

  const { dayOpen } = istBusinessWindowForDate(targetDate);

  // Cap 9 of the 10 mentors so that both racing (mentor-less) requests are
  // forced onto the same remaining mentor, making the collision deterministic.
  const cappedMentors = mentors.slice(0, 9);
  const seedStarts = [
    new Date(dayOpen.getTime()),
    new Date(dayOpen.getTime() + SLOT_MS),
  ];
  await Booking.insertMany(
    cappedMentors.flatMap((mentor) =>
      seedStarts.map((startsAt) => seededBooking(mentor._id, startsAt)),
    ),
  );

  const startsAt = new Date(dayOpen.getTime() + 2 * SLOT_MS).toISOString(); // 10:00 IST

  const book = (name: string): Promise<unknown> =>
    createBooking({
      parentName: name,
      parentEmail: `${name.toLowerCase()}@example.com`,
      timezone: IST,
      startsAt,
    } satisfies CreateBookingInput);

  const results = await Promise.allSettled([book("AutoOne"), book("AutoTwo")]);

  assertRaceResolved(results);

  const stored = await Booking.find({ startsAt: new Date(startsAt) }).lean();
  assert.equal(
    stored.length,
    1,
    "the contested slot must be assigned to exactly one mentor",
  );
});
