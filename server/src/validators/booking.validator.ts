import { z } from "zod";

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

// Validates req.query for GET /availability
export const getAvailabilitySchema = z.object({
  mentor: objectId,
  date: dateOnly,
});

// Validates req.body for POST /
export const createBookingSchema = z
  .object({
    mentor: objectId,

    parentName: z
      .string()
      .trim()
      .min(2, "Parent name must be at least 2 characters")
      .max(100, "Parent name cannot exceed 100 characters"),

    parentEmail: z
      .string()
      .email("Invalid email address")
      .transform((email) => email.trim().toLowerCase()),

    childAge: z
      .number()
      .int("Child age must be a whole number")
      .min(3, "Child must be at least 3 years old")
      .max(18, "Child age cannot exceed 18 years")
      .optional(),

    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .strict()
  .refine((data) => data.endsAt > data.startsAt, {
    message: "End time must be after start time",
    path: ["endsAt"],
  })
  .refine(
    (data) =>
      data.endsAt.getTime() - data.startsAt.getTime() === 30 * 60 * 1000,
    {
      message: "Trial class must be exactly 30 minutes",
      path: ["endsAt"],
    },
  );

// Validates req.params for GET /:id
export const getBookingByIdSchema = z.object({
  id: objectId,
});

export type GetAvailabilityInput = z.infer<typeof getAvailabilitySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type GetBookingByIdInput = z.infer<typeof getBookingByIdSchema>;
