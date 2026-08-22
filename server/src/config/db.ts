import dotenv from "dotenv";
import mongoose from "mongoose";

import { logger } from "../lib/logger";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URL}` as string);
    logger.info("MongoDB connected");
  } catch (err) {
    logger.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
};

export default connectDB;
