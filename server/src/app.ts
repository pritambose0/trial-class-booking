import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { env } from "./lib/env.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

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
  next(new Error(`Route ${req.originalUrl} not found`));
});

// Error Handling
app.use(errorHandler);

export default app;
