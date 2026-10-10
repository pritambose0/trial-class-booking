import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { ApiError } from "./utils/ApiError.js";
import { env } from "./lib/env.js";
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

// Routes
app.use("/api/mentors", mentorRoutes);
app.use("/api/bookings", bookingRoutes);

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "trial-class-booking-server",
    timestamp: new Date().toISOString(),
  });
});

// Catch-all route for non-existent paths (404)
app.use((req, _, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Error Handling
app.use(errorHandler);

export default app;
