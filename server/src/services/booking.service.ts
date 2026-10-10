import { Types } from "mongoose";
import { Booking } from "../models/booking.model.js";
import { Mentor } from "../models/mentor.model.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../lib/logger.js";
import { generateMeetingLink } from "../utils/meeting.js";
import { sendBookingEmails } from "./email.service.js";
import {
  CreateBookingInput,
  GetAvailabilityInput,
  GetBookingByIdInput,
} from "../validators/booking.validator.js";

// Slot duration and daily window constants.
const TIMEZONE_OFFSET = "+05:30";
const SLOT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const DAY_START_HOUR = 9; // 09:00 IST
const DAY_END_HOUR = 18; // 18:00 IST
const MAX_DAILY_BOOKINGS_PER_MENTOR = 2;
const MAX_DAILY_TOTAL_BOOKINGS = 20;
const MAX_ADVANCE_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const getAvailableSlots = async (query: GetAvailabilityInput) => {
  const { mentor: mentorId, date } = query;
  const mentor = await Mentor.findById(mentorId).lean();

  if (!mentor) {
    throw new ApiError(404, "Mentor not found");
  }

  // Interpret the requested date in Asia/Kolkata.
  const dayStart = new Date(
    `${date}T${String(DAY_START_HOUR).padStart(2, "0")}:00:00.000${TIMEZONE_OFFSET}`,
  );

  const dayEnd = new Date(
    `${date}T${String(DAY_END_HOUR).padStart(2, "0")}:00:00.000${TIMEZONE_OFFSET}`,
  );

  // Fetch all active bookings for the mentor on that day.
  const existingBookings = await Booking.find({
    mentor: new Types.ObjectId(mentorId),
    status: { $in: ["pending", "confirmed"] },
    startsAt: { $gte: dayStart, $lt: dayEnd },
  })
    .select("startsAt endsAt")
    .lean();

  // Check system-wide daily cap across ALL mentors.
  const totalDailyBookings = await Booking.countDocuments({
    status: { $in: ["pending", "confirmed"] },
    startsAt: { $gte: dayStart, $lt: dayEnd },
  });
  const systemCapReached = totalDailyBookings >= MAX_DAILY_TOTAL_BOOKINGS;

  // If the mentor has already reached their daily cap, or the system has reached its total cap, all slots are full.
  const dailyCapReached =
    systemCapReached ||
    existingBookings.length >= MAX_DAILY_BOOKINGS_PER_MENTOR;

  // Generate all candidate slots.
  const slots: { startsAt: string; endsAt: string; available: boolean }[] = [];

  for (
    let slotStart = dayStart.getTime();
    slotStart + SLOT_DURATION_MS <= dayEnd.getTime();
    slotStart += SLOT_DURATION_MS
  ) {
    const slotEnd = slotStart + SLOT_DURATION_MS;

    // A slot is unavailable if it is in the past, the cap is reached,
    // or it overlaps an existing booking.
    const isPast = slotStart <= Date.now();
    const isTaken =
      isPast ||
      dailyCapReached ||
      existingBookings.some(
        (b) => b.startsAt.getTime() < slotEnd && b.endsAt.getTime() > slotStart,
      );

    slots.push({
      startsAt: new Date(slotStart).toISOString(),
      endsAt: new Date(slotEnd).toISOString(),
      available: !isTaken,
    });
  }

  return {
    mentor: { id: mentor._id, name: mentor.name },
    date,
    bookingsToday: existingBookings.length,
    remainingSlots: Math.max(
      0,
      MAX_DAILY_BOOKINGS_PER_MENTOR - existingBookings.length,
    ),
    slots,
  };
};

export const createBooking = async (input: CreateBookingInput) => {
  const {
    mentor: mentorId,
    parentName,
    parentEmail,
    childAge,
    startsAt,
    endsAt,
  } = input;

  // Validate the slot within the allowed Asia/Kolkata window
  // Build the day's open/close boundaries in IST for the requested slot date.
  const slotDateStr = startsAt.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  }); // "YYYY-MM-DD"

  const dayOpenIST = new Date(
    `${slotDateStr}T${String(DAY_START_HOUR).padStart(2, "0")}:00:00.000${TIMEZONE_OFFSET}`,
  );
  const dayCloseIST = new Date(
    `${slotDateStr}T${String(DAY_END_HOUR).padStart(2, "0")}:00:00.000${TIMEZONE_OFFSET}`,
  );

  if (startsAt < dayOpenIST || endsAt > dayCloseIST) {
    throw new ApiError(
      422,
      `Bookings are only available between ${DAY_START_HOUR}:00 and ${DAY_END_HOUR}:00 IST`,
    );
  }

  // Slot must start on an exact 30-minute boundary (e.g. :00 or :30).
  const minutesIST =
    Math.floor((startsAt.getTime() - dayOpenIST.getTime()) / (60 * 1000)) % 30;

  if (minutesIST !== 0) {
    throw new ApiError(
      422,
      "Slot must start on a 30-minute boundary (e.g. 09:00, 09:30, 10:00 IST)",
    );
  }

  // Reject bookings in the past.
  if (startsAt.getTime() <= Date.now()) {
    throw new ApiError(422, "Trial classes cannot be booked in the past");
  }

  // Reject bookings too far in advance.
  if (startsAt.getTime() > Date.now() + MAX_ADVANCE_DAYS * MS_PER_DAY) {
    throw new ApiError(
      422,
      `Trial classes can only be booked up to ${MAX_ADVANCE_DAYS} days in advance`,
    );
  }

  // Verify mentor exists
  const mentor = await Mentor.findById(mentorId).lean();
  if (!mentor) {
    throw new ApiError(404, "Mentor not found");
  }

  // Generate a unique dummy meeting link for this trial class.
  const meetingLink = generateMeetingLink();

  // MongoDB session + transaction
  const session = await Booking.startSession();

  try {
    session.startTransaction();

    // System-wide daily cap check: count ALL active bookings for the same day.
    const totalDailyBookings = await Booking.countDocuments(
      {
        status: { $in: ["pending", "confirmed"] },
        startsAt: { $gte: dayOpenIST, $lt: dayCloseIST },
      },
      { session },
    );

    if (totalDailyBookings >= MAX_DAILY_TOTAL_BOOKINGS) {
      await session.abortTransaction();
      throw new ApiError(
        409,
        `The system is fully booked for the day (max ${MAX_DAILY_TOTAL_BOOKINGS} trial classes per day).`,
      );
    }

    // Daily mentor cap check: count this mentor's active bookings for the same day.
    const dailyBookingCount = await Booking.countDocuments(
      {
        mentor: new Types.ObjectId(mentorId),
        status: { $in: ["pending", "confirmed"] },
        startsAt: { $gte: dayOpenIST, $lt: dayCloseIST },
      },
      { session },
    );

    if (dailyBookingCount >= MAX_DAILY_BOOKINGS_PER_MENTOR) {
      await session.abortTransaction();
      throw new ApiError(
        409,
        `This mentor is fully booked for the day (max ${MAX_DAILY_BOOKINGS_PER_MENTOR} trial classes per day)`,
      );
    }

    // Conflict check: no overlapping active booking for this exact slot.
    const conflict = await Booking.findOne(
      {
        mentor: new Types.ObjectId(mentorId),
        status: { $in: ["pending", "confirmed"] },
        startsAt: { $lt: endsAt },
        endsAt: { $gt: startsAt },
      },
      null,
      { session },
    ).lean();

    if (conflict) {
      await session.abortTransaction();
      throw new ApiError(409, "The requested time slot is no longer available");
    }

    // Create the booking document (same session). The mentor's per-day cap
    // and slot conflicts were already validated inside this transaction.
    const [booking] = await Booking.create(
      [
        {
          mentor: mentorId,
          parentName,
          parentEmail,
          childAge,
          startsAt,
          endsAt,
          meetingLink,
        },
      ],
      { session },
    );

    // Commit
    await session.commitTransaction();

    // Notify both the parent and the mentor with the meeting link. Failures here
    // must not roll back or fail an otherwise successful booking.
    try {
      await sendBookingEmails({
        bookingId: booking._id.toString(),
        parentName,
        parentEmail,
        childAge,
        mentorName: mentor.name,
        mentorEmail: mentor.email,
        startsAt,
        endsAt,
        meetingLink,
      });
    } catch (emailErr) {
      logger.error(
        { error: emailErr, bookingId: booking._id.toString() },
        "Unexpected failure while sending booking emails",
      );
    }

    return booking;
  } catch (err) {
    // Abort on any failure that hasn't already aborted above.
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw err;
  } finally {
    await session.endSession();
  }
};

export const getBookingById = async ({ id }: GetBookingByIdInput) => {
  // Verify the booking exists
  const booking = await Booking.findById(id)
    .populate("mentor", "name email profileImage expertise")
    .lean();

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  return booking;
};
