import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeError } from "../src/middlewares/errorHandler.middleware.js";
import { ApiError } from "../src/utils/ApiError.js";

test("duplicate-key (E11000) race maps to a friendly 409", () => {
  const duplicateKey = Object.assign(new Error("E11000 duplicate key error"), {
    code: 11000,
    keyValue: { mentor: "abc", startsAt: "2026-10-20T03:30:00.000Z" },
  });

  const normalized = normalizeError(duplicateKey);

  assert.equal(normalized.statusCode, 409);
  assert.match(normalized.message, /just been booked/i);
});

test("Mongoose ValidationError maps to 422 with field errors", () => {
  const validationError = Object.assign(new Error("Booking validation failed"), {
    name: "ValidationError",
    errors: {
      parentEmail: { path: "parentEmail", message: "Invalid email address" },
    },
  });

  const normalized = normalizeError(validationError);

  assert.equal(normalized.statusCode, 422);
  assert.deepEqual(normalized.errors, [
    { field: "parentEmail", message: "Invalid email address" },
  ]);
});

test("Mongoose CastError maps to 400", () => {
  const castError = Object.assign(new Error("Cast to ObjectId failed"), {
    name: "CastError",
    path: "_id",
  });

  assert.equal(normalizeError(castError).statusCode, 400);
});

test("existing ApiError instances pass through unchanged", () => {
  const apiError = new ApiError(404, "Mentor not found");
  assert.equal(normalizeError(apiError), apiError);
});

test("unknown errors still map to an internal 500", () => {
  assert.equal(normalizeError(new Error("boom")).statusCode, 500);
  assert.equal(normalizeError("boom").statusCode, 500);
});
