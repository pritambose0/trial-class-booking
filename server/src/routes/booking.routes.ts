import { Router } from "express";
import {
  getAvailability,
  createBooking,
  getBookingById,
} from "../controllers/booking.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createBookingSchema,
  getAvailabilitySchema,
  getBookingByIdSchema,
} from "../validators/booking.validator.js";

const router = Router();

router
  .route("/availability")
  .get(validate({ query: getAvailabilitySchema }), getAvailability);

router.route("/").post(validate({ body: createBookingSchema }), createBooking);

router
  .route("/:id")
  .get(validate({ params: getBookingByIdSchema }), getBookingById);

export default router;
