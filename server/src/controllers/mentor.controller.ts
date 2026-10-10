import { Request, Response } from "express";
import {
  getAllMentors,
  getMentorById as getMentorService,
} from "../services/mentor.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMentors = asyncHandler(async (_req: Request, res: Response) => {
  const mentors = await getAllMentors();
  res
    .status(200)
    .json(new ApiResponse(200, "Mentors retrieved successfully", mentors));
});

export const getMentorById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const mentor = await getMentorService(id as string);

    if (!mentor) {
      throw new ApiError(404, "Mentor not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Mentor retrieved successfully", mentor));
  },
);
