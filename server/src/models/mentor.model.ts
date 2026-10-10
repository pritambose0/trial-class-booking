import { Document, Schema, model } from "mongoose";

export interface IMentor extends Document {
  name: string;
  email: string;
  expertise: string[];
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mentorSchema = new Schema<IMentor>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name must be at most 100 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },
    expertise: {
      type: [String],
      required: [true, "Expertise is required"],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: "A mentor must have at least one expertise",
      },
    },
    profileImage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Mentor = model<IMentor>("Mentor", mentorSchema);
