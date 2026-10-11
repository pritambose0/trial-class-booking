import { Router } from "express";
import { getMentors, getMentorById } from "../controllers/mentor.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { getMentorByIdSchema } from "../validators/mentor.validator.js";

const router = Router();

router.route("/").get(getMentors);
router.route("/:id").get(validate({ params: getMentorByIdSchema }), getMentorById);

export default router;
