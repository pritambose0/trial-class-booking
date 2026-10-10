import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectDB from "./lib/db.js";
import logger from "./lib/logger.js";
import { env } from "./lib/env.js";
import app from "./app.js";
// import { bootstrapMentors } from "./scripts/bootstrapMentors.js";

connectDB()
  .then(async () => {
    // await bootstrapMentors();
    const server = app.listen(env.port, () => {
      logger.info(`Server is running at port : ${env.port}`);
    });

    server.on("error", (error) => {
      logger.error({ error }, "Server Error Occurred");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Database Connection Failed while starting server");
    process.exit(1);
  });

process.on("unhandledRejection", (reason: unknown, p: Promise<unknown>) => {
  logger.error({ reason, p }, "Unhandled Rejection at Promise");
});

process.on("uncaughtException", (error: Error) => {
  logger.error({ error }, "Uncaught Exception Thrown");
  process.exit(1);
});
