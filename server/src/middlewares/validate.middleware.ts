import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Reusable Zod validation middleware.
 *
 * Accepts a map of request sections to schemas, e.g.
 *   validate({ body: createBookingSchema })
 *   validate({ query: getAvailabilitySchema })
 *   validate({ params: getBookingByIdSchema })
 *
 * Each section is parsed independently and the *transformed* values are written
 * back onto the request, so controllers and services see clean data (emails
 * lowercased, trimmed strings, etc.). Validation failures become a consistent
 * `422` `ApiError` with per-field messages.
 */
interface ValidationSchemas {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}

export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request["params"];
      }

      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query);

        // In Express 5 `req.query` is a getter-only property on the prototype,
        // so it cannot be reassigned. Redefine an own property to shadow it.
        Object.defineProperty(req, "query", {
          value: parsedQuery,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        next(new ApiError(422, "Validation failed", errors));
      } else {
        next(error);
      }
    }
  };
};
