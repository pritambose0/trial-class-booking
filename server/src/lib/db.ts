import mongoose from "mongoose";
import logger from "./logger.js";
import { env } from "./env.js";
import {
  MONGO_CONNECT_TIMEOUT_MS,
  MONGO_MAX_POOL_SIZE,
  MONGO_SERVER_SELECTION_TIMEOUT_MS,
  MONGO_SOCKET_TIMEOUT_MS,
} from "../constants.js";

const globalForMongoose = globalThis as unknown as {
  __trialClassBookingMongoose?: { promise: Promise<void> | null };
};

const state = (globalForMongoose.__trialClassBookingMongoose ??= {
  promise: null as Promise<void> | null,
});

export const isDBConnected = (): boolean =>
  mongoose.connection.readyState === 1;

export async function connectDB(): Promise<void> {
  if (isDBConnected()) {
    return;
  }

  if (state.promise) {
    return state.promise;
  }

  if (!env.mongoURI) {
    logger.error("MONGODB_URI is not defined in environment variables");
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  state.promise = mongoose
    .connect(env.mongoURI, {
      dbName: env.mongoDBName,
      bufferCommands: false,
      maxPoolSize: MONGO_MAX_POOL_SIZE,
      connectTimeoutMS: MONGO_CONNECT_TIMEOUT_MS,
      serverSelectionTimeoutMS: MONGO_SERVER_SELECTION_TIMEOUT_MS,
      socketTimeoutMS: MONGO_SOCKET_TIMEOUT_MS,
    })
    .then((db) => {
      logger.info(
        { host: db.connection.host, dbName: env.mongoDBName },
        "Database connected",
      );
    })
    .catch((error: unknown) => {
      state.promise = null;
      logger.error({ error }, "Database connection failed");
      throw error;
    });

  return state.promise;
}
