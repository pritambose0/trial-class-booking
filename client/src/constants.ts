// Central configuration and domain constants for the client.
// Values that can change per environment are read from `import.meta.env`.

// --- Timezone -------------------------------------------------------------
export const IST_ZONE = "Asia/Kolkata";

// --- Booking rules --------------------------------------------------------
// Number of days requested per availability page.
export const DAYS_PER_PAGE = 8;

// --- Validation limits (mirror the server's Zod rules) --------------------
export const MIN_PARENT_NAME_LENGTH = 2;
export const MAX_PARENT_NAME_LENGTH = 100;
export const MIN_CHILD_AGE = 3;
export const MAX_CHILD_AGE = 18;

// --- API ------------------------------------------------------------------
// Base URL with any trailing slashes trimmed.
export const API_URL = (
  import.meta.env.API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

// Short-lived cache for successful GET responses.
export const CACHE_TTL_MS = 30 * 1000;
