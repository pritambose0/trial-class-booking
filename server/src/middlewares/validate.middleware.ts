import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Zod validation middleware.
 *
 * Parses { body, query, params } through the provided schema.
 * After successful parse, the transformed values are written back to the
 * request object so controllers see the coerced/sanitised data
 * (e.g. emails lowercased, dates converted to Date objects, etc.).
 */
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Write transformed data back so controllers see clean values.
      if (parsed && typeof parsed === "object") {
        const source = parsed as Record<string, unknown>;

        if ("body" in source) {
          req.body = source.body;
        }

        if ("params" in source) {
          req.params = source.params as Record<string, string>;
        }

        // In Express 5 `req.query` is a getter-only property on the prototype,
        // so it cannot be reassigned. Redefine an own property to shadow it.
        if ("query" in source) {
          Object.defineProperty(req, "query", {
            value: source.query,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        }
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
