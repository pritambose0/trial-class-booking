import { Types, type HydratedDocument } from "mongoose";
import { Booking, type IBooking } from "../models/booking.model.js";
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
import {
  formatInZone,
  formatTimeInZone,
  istBusinessWindowForDate,
  istBusinessWindowForInstant,
  istMinutesSinceDayOpen,
  parseStartTime,
} from "../utils/time.js";
import {
  IST_ZONE,
  MAX_ADVANCE_DAYS,
  MAX_DAILY_BOOKINGS_PER_MENTOR,
  MAX_TRANSACTION_ATTEMPTS,
  MS_PER_DAY,
  SLOT_BOUNDARY_MINUTES,
  SLOT_DURATION_MS,
} from "../constants.js";

interface Slot {
  startsAt: string;
  endsAt: string;
  startsAtIST: string;
  endsAtIST: string;
  startsAtLocal?: string;
  endsAtLocal?: string;
  available: boolean;
}

const buildSlot = (slotStartMs: number, timezone?: string): Slot => {
  const slotStart = new Date(slotStartMs);
  const slotEnd = new Date(slotStartMs + SLOT_DURATION_MS);

  return {
    startsAt: slotStart.toISOString(),
    endsAt: slotEnd.toISOString(),
    startsAtIST: formatTimeInZone(slotStart, IST_ZONE),
    endsAtIST: formatTimeInZone(slotEnd, IST_ZONE),
    startsAtLocal: timezone ? formatTimeInZone(slotStart, timezone) : undefined,
    endsAtLocal: timezone ? formatTimeInZone(slotEnd, timezone) : undefined,
    available: true,
  };
};

// Decorates a stored booking with human-readable times in the parent's zone
// and in IST, so clients don't have to do their own timezone math.
interface BookingRecord {
  startsAt: Date;
  endsAt: Date;
  timezone: string;
}

const serializeBooking = (booking: BookingRecord) => ({
  ...booking,
  startsAtLocal: formatInZone(booking.startsAt, booking.timezone),
  endsAtLocal: formatInZone(booking.endsAt, booking.timezone),
  startsAtIST: formatInZone(booking.startsAt, IST_ZONE),
  endsAtIST: formatInZone(booking.endsAt, IST_ZONE),
});

type ActiveBooking = {
  mentor: Types.ObjectId;
  startsAt: Date;
  endsAt: Date;
};

type AssignedMentor = {
  _id: Types.ObjectId;
  name: string;
  email: string;
};

// MongoDB labels a concurrent write conflict inside a transaction with this
// error label. The recommended handling is to retry the transaction, which lets
// the loser re-read the winning booking and either pick another free mentor or
// return a clean conflict instead of a spare 500.
const isTransientTransactionError = (error: unknown): boolean => {
  const labels = (error as { errorLabels?: unknown } | null)?.errorLabels;
  return Array.isArray(labels) && labels.includes("TransientTransactionError");
};

const isSlotTaken = (
  slotStart: number,
  slotEnd: number,
  existingBookings: { startsAt: Date; endsAt: Date }[],
): boolean =>
  existingBookings.some(
    (b) => b.startsAt.getTime() < slotEnd && b.endsAt.getTime() > slotStart,
  );

export const getAvailableSlots = async (query: GetAvailabilityInput) => {
  const { date, timezone, mentor: mentorId } = query;

  // Generate candidate slots over the IST business window for that day.
  const { dayOpen, dayClose } = istBusinessWindowForDate(date);

  // Single-mentor availability.
  if (mentorId) {
    const mentor = await Mentor.findById(mentorId).lean();
    if (!mentor) {
      throw new ApiError(404, "Mentor not found");
    }

    const existingBookings = await Booking.find({
      mentor: new Types.ObjectId(mentorId),
      status: { $in: ["pending", "confirmed"] },
      startsAt: { $gte: dayOpen, $lt: dayClose },
    })
      .select("startsAt endsAt")
      .lean();

    const capReached =
      existingBookings.length >= MAX_DAILY_BOOKINGS_PER_MENTOR;

    const slots: Slot[] = [];

    for (
      let slotStart = dayOpen.getTime();
      slotStart + SLOT_DURATION_MS <= dayClose.getTime();
      slotStart += SLOT_DURATION_MS
    ) {
      const slotEnd = slotStart + SLOT_DURATION_MS;

      const slot = buildSlot(slotStart, timezone);
      slot.available = !(
        slotStart <= Date.now() ||
        capReached ||
        isSlotTaken(slotStart, slotEnd, existingBookings)
      );
      slots.push(slot);
    }

    return {
      mentor: { id: mentor._id, name: mentor.name },
      date,
      timezone,
      bookingsToday: existingBookings.length,
      remainingSlots: Math.max(
        0,
        MAX_DAILY_BOOKINGS_PER_MENTOR - existingBookings.length,
      ),
      slots,
    };
  }

  // Any-mentor availability: a slot is bookable when at least one mentor can
  // take it (under their daily cap and free at that time).
  const mentors = await Mentor.find({}).select("_id").lean();
  if (mentors.length === 0) {
    throw new ApiError(
      409,
      "No mentors are currently available to book a trial class",
    );
  }

  const activeBookings = await Booking.find({
    status: { $in: ["pending", "confirmed"] },
    startsAt: { $gte: dayOpen, $lt: dayClose },
  })
    .select("mentor startsAt endsAt")
    .lean();

  const bookingsByMentor = new Map<string, ActiveBooking[]>();
  for (const booking of activeBookings) {
    if (!booking.mentor) continue;
    const key = booking.mentor.toString();
    const list = bookingsByMentor.get(key) ?? [];
    list.push(booking);
    bookingsByMentor.set(key, list);
  }

  const isMentorFreeAt = (mentorId: Types.ObjectId, slotStart: number, slotEnd: number) => {
    const list = bookingsByMentor.get(mentorId.toString()) ?? [];
    if (list.length >= MAX_DAILY_BOOKINGS_PER_MENTOR) return false;
    return !isSlotTaken(slotStart, slotEnd, list);
  };

  const slots: Slot[] = [];

  for (
    let slotStart = dayOpen.getTime();
    slotStart + SLOT_DURATION_MS <= dayClose.getTime();
    slotStart += SLOT_DURATION_MS
  ) {
    const slotEnd = slotStart + SLOT_DURATION_MS;

    const slot = buildSlot(slotStart, timezone);
    slot.available =
      slotStart > Date.now() &&
      mentors.some((m) => isMentorFreeAt(m._id, slotStart, slotEnd));
    slots.push(slot);
  }

  return {
    mentor: null,
    date,
    timezone,
    bookingsToday: activeBookings.length,
    remainingSlots: Math.max(
      0,
      mentors.length * MAX_DAILY_BOOKINGS_PER_MENTOR - activeBookings.length,
    ),
    slots,
  };
};

export const createBooking = async (input: CreateBookingInput) => {
  const {
    mentor: requestedMentorId,
    parentName,
    parentEmail,
    childAge,
    timezone,
    startsAt,
  } = input;

  // Resolve the parent's intended start into an exact UTC instant. When
  // `startsAt` is the parent's local wall-clock time, luxon resolves it in the
  // given zone, correctly handling DST gaps/overlaps.
  const utcStart = parseStartTime(startsAt, timezone);
  const utcEnd = new Date(utcStart.getTime() + SLOT_DURATION_MS);

  // Validate the slot within the allowed IST business window for the IST day
  // that contains the requested start.
  const { dayOpen, dayClose } = istBusinessWindowForInstant(utcStart);

  if (utcStart < dayOpen || utcEnd > dayClose) {
    throw new ApiError(
      422,
      `Trial classes are only available between 09:00 and 18:00 IST`,
    );
  }

  // Slot must start on an exact 30-minute boundary in IST (e.g. :00 or :30).
  const minutesIST = Math.round(istMinutesSinceDayOpen(utcStart));
  if (minutesIST % SLOT_BOUNDARY_MINUTES !== 0) {
    throw new ApiError(
      422,
      "Trial classes must start on a 30-minute boundary (e.g. 09:00, 09:30 IST)",
    );
  }

  // Reject bookings in the past.
  if (utcStart.getTime() <= Date.now()) {
    throw new ApiError(422, "Trial classes cannot be booked in the past");
  }

  // Reject bookings too far in advance.
  if (utcStart.getTime() > Date.now() + MAX_ADVANCE_DAYS * MS_PER_DAY) {
    throw new ApiError(
      422,
      `Trial classes can only be booked up to ${MAX_ADVANCE_DAYS} days in advance`,
    );
  }

  // Generate a unique dummy meeting link for this trial class.
  const meetingLink = generateMeetingLink();

  // MongoDB session + transaction. Assignment and insert must be atomic, and
  // the unique `{ mentor, startsAt }` index is the last guard against a
  // double-booking. Under concurrency MongoDB can abort the losing transaction
  // with a transient write conflict instead of a duplicate-key error, so we
  // retry it: the retry re-reads the winning booking and either assigns another
  // free mentor or returns a clean 409.
  const session = await Booking.startSession();

  let assignedMentor: AssignedMentor | undefined;
  let booking: HydratedDocument<IBooking> | undefined;

  try {
    for (let attempt = 1; ; attempt += 1) {
      session.startTransaction();

      try {
        // Snapshot all active bookings for this IST day. Used to check both the
        // per-mentor daily cap and slot conflicts inside the transaction.
        const activeBookings = await Booking.find(
          {
            status: { $in: ["pending", "confirmed"] },
            startsAt: { $gte: dayOpen, $lt: dayClose },
          },
          null,
          { session },
        )
          .select("mentor startsAt endsAt")
          .lean();

        const bookingCounts = new Map<string, number>();
        const bookingsByMentor = new Map<string, ActiveBooking[]>();
        for (const activeBooking of activeBookings) {
          const key = activeBooking.mentor.toString();
          bookingCounts.set(key, (bookingCounts.get(key) ?? 0) + 1);

          const list = bookingsByMentor.get(key) ?? [];
          list.push(activeBooking);
          bookingsByMentor.set(key, list);
        }

        const isMentorFree = (mentorId: Types.ObjectId): boolean => {
          const key = mentorId.toString();
          if ((bookingCounts.get(key) ?? 0) >= MAX_DAILY_BOOKINGS_PER_MENTOR) {
            return false;
          }
          const list = bookingsByMentor.get(key) ?? [];
          return !isSlotTaken(utcStart.getTime(), utcEnd.getTime(), list);
        };

        // Choose the mentor:
        //  - explicit `mentor` → verify that mentor is still available;
        //  - otherwise assign any available mentor (preferring the one with the
        //    fewest bookings today, so load is spread fairly).
        const mentors = await Mentor.find({}).select("name email").lean();
        if (mentors.length === 0) {
          throw new ApiError(
            409,
            "No mentors are currently available to take a trial class",
          );
        }

        if (requestedMentorId) {
          const mentor = mentors.find(
            (m) => m._id.toString() === requestedMentorId,
          );
          if (!mentor) {
            throw new ApiError(404, "Mentor not found");
          }
          if (!isMentorFree(mentor._id)) {
            throw new ApiError(
              409,
              "This mentor is no longer available for the requested time slot",
            );
          }
          assignedMentor = mentor;
        } else {
          const candidates = mentors.filter((m) => isMentorFree(m._id));
          if (candidates.length === 0) {
            throw new ApiError(
              409,
              "No mentors are available for the requested time slot",
            );
          }

          candidates.sort(
            (a, b) =>
              (bookingCounts.get(a._id.toString()) ?? 0) -
              (bookingCounts.get(b._id.toString()) ?? 0),
          );
          assignedMentor = candidates[0];
        }

        // Create the booking document (same session). The mentor, daily cap and
        // slot conflicts were all validated inside this transaction.
        const [created] = await Booking.create(
          [
            {
              mentor: assignedMentor._id,
              parentName,
              parentEmail,
              childAge,
              startsAt: utcStart,
              endsAt: utcEnd,
              timezone,
              meetingLink,
            },
          ],
          { session },
        );
        booking = created;

        // Commit
        await session.commitTransaction();
        break;
      } catch (err) {
        // Abort whatever this attempt left open before deciding to retry.
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        if (
          isTransientTransactionError(err) &&
          attempt < MAX_TRANSACTION_ATTEMPTS
        ) {
          continue;
        }
        throw err;
      }
    }

    if (!assignedMentor || !booking) {
      throw new ApiError(500, "Booking transaction produced no booking");
    }

    const confirmedMentor = assignedMentor;
    const confirmedBooking = booking;

    // Notify both the parent and the mentor with the meeting link. Failures here
    // must not roll back or fail an otherwise successful booking.
    try {
      await sendBookingEmails({
        bookingId: confirmedBooking._id.toString(),
        parentName,
        parentEmail,
        childAge,
        mentorName: confirmedMentor.name,
        mentorEmail: confirmedMentor.email,
        startsAt: confirmedBooking.startsAt,
        endsAt: confirmedBooking.endsAt,
        timezone,
        meetingLink,
      });
    } catch (emailErr) {
      logger.error(
        { error: emailErr, bookingId: confirmedBooking._id.toString() },
        "Unexpected failure while sending booking emails",
      );
    }

    return {
      ...serializeBooking(confirmedBooking.toObject()),
      // Replace the raw mentor ObjectId with the assigned mentor's details so
      // auto-assigned bookings can render "Your mentor" without a second call.
      mentor: {
        _id: confirmedMentor._id,
        name: confirmedMentor.name,
        email: confirmedMentor.email,
      },
    };
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

  return serializeBooking(booking);
};