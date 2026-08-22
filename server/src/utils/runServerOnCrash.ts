import { logger } from "../lib/logger";

export const runServerOnCrash = () => {
  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", err);
  });
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", reason);
  });
  process.on("SIGTERM", () => {
    logger.info("SIGTERM received. Shutting down gracefully...");
  });
};
