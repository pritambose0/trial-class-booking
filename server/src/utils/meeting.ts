import { randomBytes } from "node:crypto";
import { env } from "../lib/env.js";

// Generates a unique dummy meeting link for a trial class, e.g.
// https://meet.jit.si/trial-class-a1b2c3d4e5f6a7b8
export const generateMeetingLink = (): string => {
  const roomId = randomBytes(8).toString("hex");
  return `${env.meetingBaseUrl.replace(/\/+$/, "")}/trial-class-${roomId}`;
};