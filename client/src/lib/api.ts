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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
