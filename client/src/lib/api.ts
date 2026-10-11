import type {
  ApiFieldError,
  Availability,
  Booking,
  CreateBookingInput,
  Mentor,
} from "./types";

const API_URL = (
  import.meta.env.API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

export class ApiRequestError extends Error {
  status: number;
  fieldErrors: ApiFieldError[];

  constructor(
    message: string,
    status: number,
    fieldErrors: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: ApiFieldError[];
}

// In-flight requests are shared per unique query so duplicate consumers (e.g.
// React StrictMode's double effect invocation or a retry) reuse the same
// network request instead of firing a second one.
const inflight = new Map<string, Promise<unknown>>();

// Successful GET responses are cached briefly so re-fetching an unchanged query
// (e.g. selecting more days or switching back to a timezone) is instant.
// Availability is best-effort; the server re-validates every booking, so these
// are never treated as guaranteed bookable slots.
const cache = new Map<string, { value: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 1000;

async function perform<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiRequestError(
      "Could not reach the booking server. Please make sure it is running.",
      0,
    );
  }

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !body?.success) {
    throw new ApiRequestError(
      body?.message ?? `Request failed (${res.status})`,
      res.status,
      body?.errors ?? [],
    );
  }

  return body.data as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";
  const key = `${method} ${path}`;

  // Mutating requests must always reach the server.
  if (method !== "GET") {
    return perform<T>(path, init);
  }

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = perform<T>(path, init);
  inflight.set(key, promise);

  // Attach a fully-handled chain so a failed request doesn't surface as an
  // unhandled rejection, while the original promise is still returned to the
  // caller for normal error handling.
  void promise
    .then(
      (value) => {
        cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      },
      () => {
        // Failures are never cached so they can be retried.
      },
    )
    .finally(() => {
      inflight.delete(key);
    });

  return promise;
}

export const getMentors = () => request<Mentor[]>("/mentors");

export const getAvailability = (date: string, timezone: string) =>
  request<Availability>(
    `/bookings/availability?date=${encodeURIComponent(date)}&timezone=${encodeURIComponent(timezone)}`,
  );

export const createBooking = (input: CreateBookingInput) =>
  request<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const getBooking = (id: string) => request<Booking>(`/bookings/${id}`);

// Drop cached availability right after a booking so the freshly-taken slot no
// longer advertises as available on the next reload.
export const invalidateAvailabilityCache = () => {
  for (const key of cache.keys()) {
    if (key.startsWith("GET /bookings/availability")) {
      cache.delete(key);
    }
  }
};