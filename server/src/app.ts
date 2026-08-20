import express, { Request, Response } from "express";

import chatListRoute from "./routes/chatListRoute";
import conversationRoute from "./routes/conversationRoute";
import cookieParser from "cookie-parser";
import cors from "cors";
import { downLoadFile } from "./utils/downloadFile";
import { errorHandler } from "./lib/error-handler";
import { env } from "./config/env";
import friendRequestRoute from "./modules/friendRequest/routes";
import helmet from "helmet";
import { authLimiter, otpLimiter } from "./middlewares/rateLimiter";
import messageRoute from "./routes/messageRoute";
import otpRoute from "./modules/otp/routes";
import path from "path";
import uploadRoute from "./routes/uploadRoute";
import verifyJWT from "./middlewares/verifyJWT";
import { authRouter, userRouter } from "./modules/user/routes";

/**
 * Express app construction — split out of server.ts so the app itself is
 * testable/importable without also binding a port or starting Socket.IO.
 */
export function createApp() {
  const app = express();

  // Required for express-rate-limit (and req.ip generally) to see the real
  // client IP behind a reverse proxy (Render/Railway/etc.) instead of the
  // proxy's own IP for every request — without this, rate limits below
  // would effectively apply to all users collectively, not per-client.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      optionsSuccessStatus: 200,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/", (_req: Request, res: Response) => {
    res.send("Connect+ server is running...");
  });

  // Migrated modules
  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/otp", otpLimiter, otpRoute);
  app.use("/api/user", userRouter);
  app.use("/api/friendRequest", friendRequestRoute); // applies verifyJWT itself

  // Not yet migrated (still the old flat controllers) — kept mounted so the
  // app stays fully functional while Phase 2 lands module by module.
  app.use("/api/chatlist", verifyJWT, chatListRoute);
  app.use("/api/conversation", verifyJWT, conversationRoute);
  app.use("/api/message", verifyJWT, messageRoute);

  app.use(
    "/api/upload",
    express.static(path.join(__dirname, "./upload")),
    verifyJWT,
    uploadRoute
  );
  app.get(
    "/api/download/:filename",
    express.static(path.join(__dirname, "./upload")),
    verifyJWT,
    downLoadFile
  );
  app.use(
    "/api/file",
    express.static(path.join(__dirname, "./upload")),
    (_req, res) => {
      res.json(200);
    }
  );

  // 404
  app.all("*", (req, res) => {
    res.status(404);
    if (req.accepts("html")) {
      res.sendFile(path.join(__dirname, "Views", "404.html"));
    } else if (req.accepts("json")) {
      res.json({ error: "404 Not Found" });
    } else {
      res.type("txt").send("404 Not Found");
    }
  });

  // Central error handler — last middleware. Catches anything that bypassed
  // asyncWrapper's own try/catch (e.g. a sync throw in non-wrapped code).
  app.use(errorHandler);

  return app;
}
