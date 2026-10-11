import { test } from "node:test";
import assert from "node:assert/strict";
import type { NextFunction, Request, Response } from "express";
import { validate } from "../src/middlewares/validate.middleware.js";
import { ApiError } from "../src/utils/ApiError.js";
import {
  createBookingSchema,
  getAvailabilitySchema,
} from "../src/validators/booking.validator.js";

const run = (
  middleware: (req: Request, res: Response, next: NextFunction) => unknown,
  req: Record<string, unknown>,
): Promise<unknown> =>
  new Promise((resolve) => {
    middleware(
      req as unknown as Request,
      {} as Response,
      ((err?: unknown) => resolve(err)) as NextFunction,
    );
  });

test("validate transforms and writes the parsed body back onto the request", async () => {
  const req = {
    body: {
      parentName: "Jane Doe",
      parentEmail: "Jane@Example.com",
      timezone: "Europe/London",
      startsAt: "2026-10-20T09:00:00",
    },
  };

  const err = await run(validate({ body: createBookingSchema }), req);

  assert.equal(err, undefined);
  assert.equal((req.body as { parentEmail: string }).parentEmail, "jane@example.com");
});

test("validate rejects an invalid body with a 422 ApiError", async () => {
  const req = { body: { parentName: "J" } };

  const err = await run(validate({ body: createBookingSchema }), req);

  assert.ok(err instanceof ApiError);
  assert.equal((err as ApiError).statusCode, 422);
  assert.ok(Array.isArray((err as ApiError).errors));
});

test("validate shadows Express 5's getter-only req.query with the parsed value", async () => {
  const req = { query: { date: "2026-10-20", timezone: "Europe/London" } };

  const err = await run(validate({ query: getAvailabilitySchema }), req);

  assert.equal(err, undefined);
  assert.equal((req.query as { date: string }).date, "2026-10-20");
});
