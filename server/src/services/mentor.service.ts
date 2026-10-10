import { Mentor } from "../models/mentor.model.js";

export const getAllMentors = async () => {
  return await Mentor.find({});
};

export const getMentorById = async (id: string) => {
  return await Mentor.findById(id);
};
