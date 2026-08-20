import { NextFunction, Request, Response } from "express";
import * as yup from "yup";

import mongoose from "mongoose";
import { ApiError } from "./api-error";
import { errorResponse } from "./response-handlers";
import { logger } from "./logger";

/**
 * Central error → HTTP response mapping, used by asyncWrapper's catch block
 * and mounted as the last Express middleware. Never leaks a raw error object
 * or stack trace to the client (see the audit's `deleteUser` finding).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof yup.ValidationError) {
    return errorResponse(res, {
      status: 422,
      message: "Validation failed",
      errors: err.errors,
    });
  }

  if (err instanceof ApiError) {
    return errorResponse(res, { status: err.status, message: err.message });
  }

  if (err instanceof mongoose.Error.CastError) {
    return errorResponse(res, { status: 400, message: `Invalid ${err.path}: ${err.value}` });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return errorResponse(res, {
      status: 400,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Mongo duplicate-key error (E11000) — not a mongoose.Error subclass, detected by code.
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === 11000
  ) {
    return errorResponse(res, { status: 409, message: "Duplicate value" });
  }

  logger.error("Unhandled error", err);
  return errorResponse(res, { status: 500, message: "Internal server error" });
}
