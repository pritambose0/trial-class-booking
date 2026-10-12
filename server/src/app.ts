import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { ApiError } from "./utils/ApiError.js";
import { env } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { API_PREFIX, JSON_BODY_LIMIT, SERVICE_NAME } from "./constants.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import bookingRoutes from "./routes/booking.routes.js";
import mentorRoutes from "./routes/mentor.routes.js";

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
);
app.use(helmet());

app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));
app.use(cookieParser());

app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({
    status: "ok",
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
});

app.use(API_PREFIX, async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    next(
      new ApiError(
        503,
        "The booking service is temporarily unavailable. Please try again in a moment.",
      ),
    );
  }
});

// Routes
app.use(`${API_PREFIX}/mentors`, mentorRoutes);
app.use(`${API_PREFIX}/bookings`, bookingRoutes);

// Catch-all route for non-existent paths (404)
app.use((req, _, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Error Handling
app.use(errorHandler);

export default app;
