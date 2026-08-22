import { NextFunction, Request, Response } from "express";

import { logger } from "../lib/logger";

/**
 * Logs every request: method, path, status, duration, and the acting
 * user id when authenticated. Mounted first (before routing) so it wraps
 * everything — the server had zero request visibility before this; you
 * could not tell whether a request even reached the process, let alone
 * what it did once here.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    // req.userId is set by verifyJWT earlier in the chain for protected
    // routes — by the time "finish" fires the whole request has already
    // run, so it's populated here even though this middleware itself runs
    // before routing.
    const userPart = req.userId ? ` userId=${req.userId}` : "";
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms${userPart}`;

    if (res.statusCode >= 500) {
      logger.error(line);
    } else if (res.statusCode >= 400) {
      logger.warn(line);
    } else {
      logger.info(line);
    }
  });

  next();
}
