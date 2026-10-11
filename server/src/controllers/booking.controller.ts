import { Request, Response } from "express";
import {
  getAvailableSlots,
  createBooking as createBookingService,
  getBookingById as getBookingByIdService,
} from "../services/booking.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type {
  CreateBookingInput,
  GetAvailabilityInput,
  GetBookingByIdInput,
} from "../validators/booking.validator.js";

// GET /api/v1/bookings/availability
// Query is validated (and transformed) by the validate middleware in the route.
export const getAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as GetAvailabilityInput;

    const slots = await getAvailableSlots(query);

    res
      .status(200)
      .json(new ApiResponse(200, "Availability retrieved successfully", slots));
  },
);

// POST /api/v1/bookings
// Body is validated (and transformed) by the validate middleware in the route.
export const createBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as CreateBookingInput;

    const newBooking = await createBookingService(body);

    res
      .status(201)
      .json(new ApiResponse(201, "Booking created successfully", newBooking));
  },
);

// GET /api/v1/bookings/:id
// Params are validated by the validate middleware in the route.
export const getBookingById = asyncHandler(
  async (req: Request, res: Response) => {
    const params = req.params as unknown as GetBookingByIdInput;

    const booking = await getBookingByIdService(params);

    res
      .status(200)
      .json(new ApiResponse(200, "Booking retrieved successfully", booking));
  },
);
