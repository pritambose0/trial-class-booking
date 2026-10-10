import { Router } from "express";
import {
  getAvailability,
  createBooking,
  getBookingById,
} from "../controllers/booking.controller.js";

const router = Router();

router.route("/availability").get(getAvailability);
router.route("/").post(createBooking);
router.route("/:id").get(getBookingById);

export default router;
