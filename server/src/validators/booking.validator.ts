import { z } from "zod";
import { isValidTimeZone, parseStartTime } from "../utils/time.js";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Invalid date");

const timezone = z
  .string()
  .trim()
  .min(1, "Timezone is required")
  .refine(isValidTimeZone, "Invalid IANA timezone (e.g. America/New_York)");

export const getAvailabilitySchema = z
  .object({
    date: dateOnly,
    timezone: timezone.optional(),
    mentor: objectId.optional(),
  })
  .strict();

export const createBookingSchema = z
  .object({
    mentor: objectId.optional(),

    parentName: z
      .string()
      .trim()
      .min(2, "Parent name must be at least 2 characters")
      .max(100, "Parent name cannot exceed 100 characters"),

    parentEmail: z
      .email("Invalid email address")
      .transform((email) => email.trim().toLowerCase()),

    childAge: z
      .number()
      .int("Child age must be a whole number")
      .min(3, "Child must be at least 3 years old")
      .max(18, "Child age cannot exceed 18 years")
      .optional(),

    timezone,

    startsAt: z.string().min(1, "Start time is required"),
  })
  .strict()
  .refine(
    (data) => {
      try {
        parseStartTime(data.startsAt, data.timezone);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Start time must be a valid date-time in the given timezone",
      path: ["startsAt"],
    },
  );

export const getBookingByIdSchema = z.object({
  id: objectId,
});

export type GetAvailabilityInput = z.infer<typeof getAvailabilitySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type GetBookingByIdInput = z.infer<typeof getBookingByIdSchema>;
