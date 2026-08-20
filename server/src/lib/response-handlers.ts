import { Response } from "express";

interface SuccessOptions<T = unknown> {
  status?: number;
  message?: string;
  data?: T;
}

interface ErrorOptions {
  status?: number;
  message?: string;
  errors?: unknown;
}

/** Sends a uniform `{ success: true, message, data }` response. */
export function successResponse<T>(
  res: Response,
  { status = 200, message = "OK", data }: SuccessOptions<T>
) {
  return res.status(status).json({ success: true, message, data });
}

/** Sends a uniform `{ success: false, message, errors }` response. Never leaks raw error objects. */
export function errorResponse(
  res: Response,
  { status = 500, message = "Something went wrong", errors }: ErrorOptions
) {
  return res.status(status).json({ success: false, message, errors });
}
