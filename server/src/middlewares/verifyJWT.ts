import { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { errorResponse } from "../lib/response-handlers";

interface AccessTokenPayload {
  id: string;
}

/**
 * Verifies the access token and sets `req.userId` to the token's subject.
 *
 * Fix for the audit's critical finding: the old version set `req.user =
 * decoded.username`, but tokens are signed with `{ id: userId }` only — so
 * `req.user` was always `undefined` and every controller fell back to
 * trusting a client-supplied `userId` in the body/query instead (the IDOR
 * hole). Every controller must use `req.userId` from here on, never
 * `req.body.userId` / `req.query.userId` to determine the acting user.
 */
const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    errorResponse(res, { status: 401, message: "Access token not found" });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    errorResponse(res, { status: 401, message: "Access token not found" });
    return;
  }

  jwt.verify(token, env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err || !decoded || typeof decoded === "string") {
      errorResponse(res, { status: 403, message: "Invalid access token" });
      return;
    }

    const payload = decoded as AccessTokenPayload;
    req.userId = payload.id;
    next();
  });
};

export default verifyJWT;
