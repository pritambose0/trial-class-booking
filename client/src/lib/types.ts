export interface Mentor {
  _id: string;
  name: string;
  email: string;
  expertise: string[];
  profileImage?: string;
}

export interface AvailabilitySlot {
  startsAt: string;
  endsAt: string;
  startsAtIST: string;
  endsAtIST: string;
  startsAtLocal?: string;
  endsAtLocal?: string;
  available: boolean;
}

export interface Availability {
  mentor: { id: string; name: string } | null;
  date: string;
  timezone?: string;
  bookingsToday: number;
  remainingSlots: number;
  slots: AvailabilitySlot[];
}

export interface Booking {
  _id: string;
  mentor: { _id: string; name: string; email?: string };
  parentName: string;
  parentEmail: string;
  childAge?: number;
  startsAt: string;
  endsAt: string;
  status: string;
  timezone: string;
  meetingLink: string;
  startsAtLocal: string;
  endsAtLocal: string;
  startsAtIST: string;
  endsAtIST: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingInput {
  parentName: string;
  parentEmail: string;
  childAge?: number;
  timezone: string;
  startsAt: string;
}

export interface ApiFieldError {
  field: string;
  message: string;
}
