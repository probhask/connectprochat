import { env } from "../config/env";

/**
 * The one place `console.*` is allowed to run directly (see eslint.config.js's
 * per-file override). Every other file must log through this instead of
 * calling console.* itself — keeps "no bare console.log" enforceable by ESLint
 * everywhere else, and gives one place to swap in a real log sink later.
 */

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug(message: string, meta?: unknown): void {
    if (env.NODE_ENV === "development") {
      console.debug(`[${timestamp()}] DEBUG: ${message}`, meta ?? "");
    }
  },
  info(message: string, meta?: unknown): void {
    console.info(`[${timestamp()}] INFO: ${message}`, meta ?? "");
  },
  warn(message: string, meta?: unknown): void {
    console.warn(`[${timestamp()}] WARN: ${message}`, meta ?? "");
  },
  error(message: string, error?: unknown): void {
    console.error(`[${timestamp()}] ERROR: ${message}`, error ?? "");
  },
};
