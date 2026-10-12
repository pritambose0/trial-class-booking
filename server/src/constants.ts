// Central configuration and domain constants for the booking service.
// Values that can change per environment live in lib/env.ts instead.

// --- Timezone & business hours -------------------------------------------
// Mentors operate on Indian Standard Time. India has no DST, so the offset is
// constant in the scheduling logic; parents' zones are resolved through named
// zone conversions, which handle DST transitions automatically.
export const IST_ZONE = "Asia/Kolkata";

// Daily business hours for trial classes, expressed in IST.
export const IST_DAY_START_HOUR = 9;
export const IST_DAY_END_HOUR = 18;

// --- Scheduling rules -----------------------------------------------------
export const SLOT_DURATION_MS = 30 * 60 * 1000;
export const SLOT_BOUNDARY_MINUTES = 30;
export const MAX_DAILY_BOOKINGS_PER_MENTOR = 2;
export const MAX_ADVANCE_DAYS = 30;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MAX_TRANSACTION_ATTEMPTS = 3;

// --- Validation limits ----------------------------------------------------
export const MIN_PARENT_NAME_LENGTH = 2;
export const MAX_PARENT_NAME_LENGTH = 100;
export const MIN_CHILD_AGE = 3;
export const MAX_CHILD_AGE = 18;

// --- HTTP / API -----------------------------------------------------------
export const API_PREFIX = "/api/v1";
export const JSON_BODY_LIMIT = "16kb";
export const SERVICE_NAME = "trial-class-booking-server";

// --- Database connection --------------------------------------------------
export const MONGO_CONNECT_TIMEOUT_MS = 8000;
export const MONGO_SERVER_SELECTION_TIMEOUT_MS = 8000;
export const MONGO_SOCKET_TIMEOUT_MS = 30000;
export const MONGO_MAX_POOL_SIZE = 10;
