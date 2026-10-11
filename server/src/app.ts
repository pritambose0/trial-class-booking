import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { ApiError } from "./utils/ApiError.js";
import { env } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
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

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "trial-class-booking-server",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1", async (_req, _res, next) => {
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
app.use("/api/v1/mentors", mentorRoutes);
app.use("/api/v1/bookings", bookingRoutes);

// Catch-all route for non-existent paths (404)
app.use((req, _, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Error Handling
app.use(errorHandler);

export default app;
