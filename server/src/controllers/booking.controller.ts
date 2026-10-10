import { Request, Response } from "express";
import {
  getAvailableSlots,
  createBooking as createBookingService,
  getBookingById as getBookingByIdService,
} from "../services/booking.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../utils/validate.js";
import {
  createBookingSchema,
  getAvailabilitySchema,
  getBookingByIdSchema,
} from "../validators/booking.validator.js";

// GET /api/bookings/availability?mentor=<id>&date=<YYYY-MM-DD>
export const getAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const query = validate(getAvailabilitySchema, req.query);

    const slots = await getAvailableSlots(query);

    res
      .status(200)
      .json(new ApiResponse(200, "Availability retrieved successfully", slots));
  },
);

// POST /api/bookings
export const createBooking = asyncHandler(
  async (req: Request, res: Response) => {
    const body = validate(createBookingSchema, req.body);

    const newBooking = await createBookingService(body);

    res
      .status(201)
      .json(new ApiResponse(201, "Booking created successfully", newBooking));
  },
);

// GET /api/bookings/:id
export const getBookingById = asyncHandler(
  async (req: Request, res: Response) => {
    const params = validate(getBookingByIdSchema, req.params);

    const booking = await getBookingByIdService(params);

    res
      .status(200)
      .json(new ApiResponse(200, "Booking retrieved successfully", booking));
  },
);
