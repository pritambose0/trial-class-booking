import mongoose from "mongoose";
import logger from "./logger.js";
import { env } from "./env.js";

async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    logger.debug("Already connected to database");
    return;
  }

  if (!env.mongoURI) {
    logger.error("MONGODB_URI is not defined in environment variables");
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    const db = await mongoose.connect(env.mongoURI, {
      dbName: env.mongoDBName,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });

    logger.info(
      { host: db.connection.host, dbName: env.mongoDBName },
      "Database connected",
    );
  } catch (error) {
    logger.error({ error }, "Database connection failed");
    throw new Error("Database connection failed");
  }
}

export default connectDB;
