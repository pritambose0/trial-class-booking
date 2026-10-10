import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid mentor ID format");

export const getMentorByIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});
