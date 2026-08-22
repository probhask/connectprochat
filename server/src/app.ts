import express, { Request, Response } from "express";

import conversationRoute from "./modules/conversation/routes";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./lib/error-handler";
import { env } from "./config/env";
import friendRequestRoute from "./modules/friendRequest/routes";
import helmet from "helmet";
import { authLimiter, otpLimiter } from "./middlewares/rateLimiter";
import otpRoute from "./modules/otp/routes";
import path from "path";
import { requestLogger } from "./middlewares/requestLogger";
import uploadRoute, { downloadRouter, viewRouter } from "./modules/upload/routes";
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
  app.use(requestLogger);
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

  // Migrated modules — all apply verifyJWT themselves
  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/otp", otpLimiter, otpRoute);
  app.use("/api/user", userRouter);
  app.use("/api/friendRequest", friendRequestRoute);
  // chatList and message are folded into the conversation module — see
  // revamp plan Section A module-boundary decisions.
  app.use("/api/conversation", conversationRoute);
  app.use("/api/upload", uploadRoute);
  app.use("/api/download", downloadRouter);
  // /api/file/:filename serves media inline for <img>/<video> tags, which
  // can't attach the Authorization header /api/download requires — see
  // modules/upload/controllers.ts's viewFile doc comment for why this is
  // safe unauthenticated (unlike the removed express.static-over-the-whole-
  // upload-dir bug: this only ever serves one exact, unguessable filename
  // via resolveSafeDownloadPath, never a directory listing). helmet's
  // default Cross-Origin-Resource-Policy: same-origin would otherwise block
  // the client (a different origin/port in dev, a different domain in
  // prod) from loading these images at all — cross-origin is the whole
  // point of this route, so it's loosened only here, not globally.
  app.use(
    "/api/file",
    (_req, res, next) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    viewRouter
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
