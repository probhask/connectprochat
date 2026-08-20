import { ErrorRequestHandler } from "express";
import * as yup from "yup";

import mongoose from "mongoose";
import { ApiError } from "./api-error";
import { errorResponse } from "./response-handlers";
import { logger } from "./logger";

/**
 * Central error → HTTP response mapping, used by asyncWrapper's catch block
 * and mounted as the last Express middleware. Never leaks a raw error object
 * or stack trace to the client (see the audit's `deleteUser` finding).
 *
 * Typed as Express's own `ErrorRequestHandler` (rather than inferred) so
 * `app.use(errorHandler)` resolves to Express's 4-arg error-middleware
 * overload instead of being mistaken for a route path.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof yup.ValidationError) {
    errorResponse(res, { status: 422, message: "Validation failed", errors: err.errors });
    return;
  }

  if (err instanceof ApiError) {
    errorResponse(res, { status: err.status, message: err.message });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    errorResponse(res, { status: 400, message: `Invalid ${err.path}: ${err.value}` });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    errorResponse(res, {
      status: 400,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => e.message),
    });
    return;
  }

  // Mongo duplicate-key error (E11000) — not a mongoose.Error subclass, detected by code.
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === 11000
  ) {
    errorResponse(res, { status: 409, message: "Duplicate value" });
    return;
  }

  logger.error("Unhandled error", err);
  errorResponse(res, { status: 500, message: "Internal server error" });
};
