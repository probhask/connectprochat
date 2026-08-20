import http from "http";

import cron from "node-cron";

import { createApp } from "./app";
import connectDB from "./config/db";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { runServerOnCrash } from "./utils/runServerOnCrash";

connectDB();

const app = createApp();

// Keep-alive ping for a free-tier host that sleeps after ~15min idle.
// TODO(revamp Phase 6): remove once off the sleeping free tier — see plan's
// hosting recommendation; this is pure overhead on an always-on host.
cron.schedule("*/14 * * * *", () => {
  http
    .get(env.BACKEND_URL, (res) => {
      if (res.statusCode !== 200) {
        logger.warn("Keep-alive ping got a non-200 status", res.statusCode);
      }
    })
    .on("error", (err) => {
      logger.error("Keep-alive ping failed", err);
    });
});

runServerOnCrash();

const PORT = env.PORT;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} (${env.BACKEND_URL})`);
});
