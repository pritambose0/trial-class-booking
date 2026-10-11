import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import logger from "../lib/logger.js";

interface DuplicateKeyError {
  code: number;
  keyValue?: Record<string, unknown>;
}

interface MongooseFieldError {
  path?: string;
  message?: string;
}

interface MongooseValidationError {
  name: "ValidationError";
  message: string;
  errors: Record<string, MongooseFieldError>;
}

interface MongooseCastError {
  name: "CastError";
  path?: string;
}

const isDuplicateKeyError = (e: unknown): e is DuplicateKeyError =>
  typeof e === "object" &&
  e !== null &&
  (e as { code?: unknown }).code === 11000;

const isMongooseValidationError = (
  e: unknown,
): e is MongooseValidationError =>
  typeof e === "object" &&
  e !== null &&
  (e as { name?: unknown }).name === "ValidationError" &&
  typeof (e as { errors?: unknown }).errors === "object";

const isMongooseCastError = (e: unknown): e is MongooseCastError =>
  typeof e === "object" &&
  e !== null &&
  (e as { name?: unknown }).name === "CastError";

// Translates known database/driver failures into clean HTTP responses so
// clients get actionable status codes instead of a generic 500. This is what
// makes the worst-case booking race (two requests for the same mentor + slot)
// return a friendly 409 rather than leaking a raw duplicate-key error.
export const normalizeError = (err: unknown): ApiError => {
  if (err instanceof ApiError) {
    return err;
  }

  if (isDuplicateKeyError(err)) {
    return new ApiError(
      409,
      "That time slot has just been booked. Please choose another slot.",
    );
  }

  if (isMongooseValidationError(err)) {
    const errors = Object.values(err.errors).map((fieldError) => ({
      field: fieldError.path ?? "unknown",
      message: fieldError.message ?? "Invalid value",
    }));

    return new ApiError(422, "Validation failed", errors);
  }

  if (isMongooseCastError(err)) {
    return new ApiError(400, "Invalid request parameter");
  }

  if (err instanceof Error) {
    return new ApiError(
      500,
      err.message || "Internal Server Error",
      [],
      false,
      err.stack,
    );
  }

  return new ApiError(500, "Internal Server Error");
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const error = normalizeError(err);

  // Log full error details
  logger.error({
    method: req.method,
    url: req.url,
    status: error.statusCode,
    message: error.message,
    stack: error.stack,
  });

  // Hide internal errors in production
  const responseMessage =
    error.isOperational || process.env.NODE_ENV === "development"
      ? error.message
      : "Something went wrong";

  return res.status(error.statusCode).json({
    success: false,
    message: responseMessage,
    errors: error.errors,
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
    }),
  });
};
