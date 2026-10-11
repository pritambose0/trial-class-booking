import { test } from "node:test";
import assert from "node:assert/strict";
import { generateMeetingLink } from "../src/utils/meeting.js";
import { env } from "../src/lib/env.js";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("generateMeetingLink builds a dummy room URL under the configured base", () => {
  const base = env.meetingBaseUrl.replace(/\/+$/, "");
  const link = generateMeetingLink();

  assert.match(
    link,
    new RegExp(`^${escapeRegex(base)}/trial-class-[0-9a-f]{16}$`),
  );
});

test("generateMeetingLink produces a unique link per call", () => {
  const links = new Set(Array.from({ length: 50 }, () => generateMeetingLink()));
  assert.equal(links.size, 50);
});
