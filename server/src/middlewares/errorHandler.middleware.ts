import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import logger from "../lib/logger.js";

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  let error: ApiError;

  // Normalize error
  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof Error) {
    error = new ApiError(
      500,
      err.message || "Internal Server Error",
      [],
      false,
      err.stack,
    );
  } else {
    error = new ApiError(500, "Internal Server Error");
  }

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
