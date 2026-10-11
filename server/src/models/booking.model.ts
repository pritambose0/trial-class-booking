import { Document, Schema, model, Types } from "mongoose";

export interface IBooking extends Document {
  mentor: Types.ObjectId;
  parentName: string;
  parentEmail: string;
  childAge?: number;
  startsAt: Date;
  endsAt: Date;
  status: "pending" | "confirmed" | "cancelled";
  timezone: string;
  meetingLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "Mentor",
      required: [true, "Mentor reference is required"],
    },

    parentName: {
      type: String,
      required: [true, "Parent/guardian name is required"],
      trim: true,
      minlength: [2, "Parent name must be at least 2 characters long"],
      maxlength: [100, "Parent name cannot exceed 100 characters"],
    },

    parentEmail: {
      type: String,
      required: [true, "Parent/guardian email is required"],
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    childAge: {
      type: Number,
      min: [3, "Child must be at least 3 years old"],
      max: [18, "Child age cannot exceed 18 years"],
      validate: {
        validator: (value: number | undefined) =>
          value === undefined || Number.isInteger(value),
        message: "Child age must be a whole number",
      },
    },

    startsAt: {
      type: Date,
      required: [true, "Booking start time is required"],
    },

    endsAt: {
      type: Date,
      required: [true, "Booking end time is required"],
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "cancelled"],
        message: "{VALUE} is not a valid booking status",
      },
      default: "pending",
      required: true,
    },

    timezone: {
      type: String,
      required: [true, "Parent timezone is required"],
      trim: true,
      maxlength: [64, "Timezone name cannot exceed 64 characters"],
    },

    meetingLink: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Validate the relationship between start and end on document validation.
bookingSchema.pre("validate", function () {
  if (
    this.startsAt instanceof Date &&
    !Number.isNaN(this.startsAt.getTime()) &&
    this.endsAt instanceof Date &&
    !Number.isNaN(this.endsAt.getTime()) &&
    this.endsAt <= this.startsAt
  ) {
    this.invalidate("endsAt", "End time must be after start time");
  }
});

// Compound index for fast overlap conflict detection on active bookings.
bookingSchema.index({ mentor: 1, status: 1, startsAt: 1, endsAt: 1 });

// Index for listing a mentor's bookings chronologically.
bookingSchema.index({ mentor: 1, startsAt: 1 }, { unique: true });

export const Booking = model<IBooking>("Booking", bookingSchema);
