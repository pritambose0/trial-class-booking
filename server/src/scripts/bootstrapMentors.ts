import logger from "../lib/logger.js";
import { Mentor } from "../models/mentor.model.js";

interface MentorSeed {
  name: string;
  email: string;
  expertise: string[];
  profileImage?: string;
}

export const MENTOR_ROSTER: MentorSeed[] = [
  {
    name: "Aarav Sharma",
    email: "rexaw91050@aahzz.com",
    expertise: ["Mathematics", "Science"],
    profileImage:
      "https://api.dicebear.com/9.x/initials/svg?seed=Aarav%20Sharma",
  },
  {
    name: "Diya Patel",
    email: "diya.patel@mentor.codeyoung.demo",
    expertise: ["English", "Reading"],
    profileImage: "https://api.dicebear.com/9.x/initials/svg?seed=Diya%20Patel",
  },
  {
    name: "Vivaan Reddy",
    email: "vivaan.reddy@mentor.codeyoung.demo",
    expertise: ["Coding", "Robotics"],
    profileImage:
      "https://api.dicebear.com/9.x/initials/svg?seed=Vivaan%20Reddy",
  },
  {
    name: "Ananya Iyer",
    email: "ananya.iyer@mentor.codeyoung.demo",
    expertise: ["Mathematics", "Physics"],
    profileImage:
      "https://api.dicebear.com/9.x/initials/svg?seed=Ananya%20Iyer",
  },
  {
    name: "Aditya Nair",
    email: "aditya.nair@mentor.codeyoung.demo",
    expertise: ["Coding", "Web Development"],
    profileImage:
      "https://api.dicebear.com/9.x/initials/svg?seed=Aditya%20Nair",
  },
  {
    name: "Ishaan Gupta",
    email: "ishaan.gupta@mentor.codeyoung.demo",
    expertise: ["Science", "Chemistry"],
    profileImage:
      "https://api.dicebear.com/9.x/initials/svg?seed=Ishaan%20Gupta",
  },
  {
    name: "Myra Singh",
    email: "myra.singh@mentor.codeyoung.demo",
    expertise: ["English", "Creative Writing"],
    profileImage: "https://api.dicebear.com/9.x/initials/svg?seed=Myra%20Singh",
  },
  {
    name: "Kabir Mehta",
    email: "kabir.mehta@mentor.codeyoung.demo",
    expertise: ["Mathematics", "Logical Reasoning"],
    profileImage:
      "https://api.dicebear.com/9.x/initials/svg?seed=Kabir%20Mehta",
  },
  {
    name: "Anika Desai",
    email: "anika.desai@mentor.codeyoung.demo",
    expertise: ["Coding", "Game Development"],
    profileImage:
      "https://api.dicebear.com/9.x/initials/svg?seed=Anika%20Desai",
  },
  {
    name: "Rohan Joshi",
    email: "rohan.joshi@mentor.codeyoung.demo",
    expertise: ["Physics", "Mathematics"],
    profileImage:
      "https://api.dicebear.com/9.x/initials/svg?seed=Rohan%20Joshi",
  },
];

export async function bootstrapMentors(): Promise<{
  upserted: number;
  matched: number;
}> {
  const operations = MENTOR_ROSTER.map((mentor) => ({
    updateOne: {
      filter: { email: mentor.email },
      update: { $set: mentor },
      upsert: true,
    },
  }));

  const result = await Mentor.bulkWrite(operations);

  logger.info(
    {
      upserted: result.upsertedCount,
      matched: result.matchedCount,
      total: MENTOR_ROSTER.length,
    },
    "Mentor roster bootstrapped",
  );

  return {
    upserted: result.upsertedCount,
    matched: result.matchedCount,
  };
}
