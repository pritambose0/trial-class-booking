import { z } from "zod";

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid mentor ID format");

export const getMentorByIdSchema = z.object({
  id: objectId,
});
