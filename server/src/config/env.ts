import * as yup from "yup";
import dotenv from "dotenv";

dotenv.config();

function isValidUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Typed, validated environment configuration.
 *
 * Every env var the app depends on is declared here once and validated at boot —
 * replaces scattered `process.env.X as string` casts (several of which, pre-revamp,
 * silently referenced the wrong key name and resolved to `undefined`; see
 * `Refresh_TOKEN_SECRET` vs the real `REFRESH_TOKEN_SECRET` bug found in the audit).
 * Import `env` everywhere instead of touching `process.env` directly.
 */
const envSchema = yup.object({
  NODE_ENV: yup
    .string()
    .oneOf(["development", "production", "test"])
    .default("development"),
  PORT: yup.number().integer().positive().default(5000),

  MONGO_URL: yup.string().required("MONGO_URL is required"),
  DB_NAME: yup.string().required("DB_NAME is required"),

  ACCESS_TOKEN_SECRET: yup.string().required("ACCESS_TOKEN_SECRET is required"),
  REFRESH_TOKEN_SECRET: yup.string().required("REFRESH_TOKEN_SECRET is required"),
  ACCESS_TOKEN_EXPIRATION: yup.string().required("ACCESS_TOKEN_EXPIRATION is required"),
  REFRESH_TOKEN_EXPIRATION: yup.string().required("REFRESH_TOKEN_EXPIRATION is required"),

  // yup's built-in .url() rejects host-only URLs like "http://localhost:5173"
  // (no TLD) in the installed yup version — would block every local dev boot.
  // The native URL constructor is the correct, permissive check here.
  BACKEND_URL: yup
    .string()
    .required("BACKEND_URL is required")
    .test("is-url", "BACKEND_URL must be a valid URL", isValidUrl),
  FRONTEND_URL: yup
    .string()
    .required("FRONTEND_URL is required")
    .test("is-url", "FRONTEND_URL must be a valid URL", isValidUrl),

  // Email/OTP verification (Section G) — swapped from Resend to Nodemailer
  // over Gmail SMTP: Resend requires verifying a domain you own before it
  // will send to arbitrary recipients, and this app doesn't have one.
  // Gmail SMTP + an account App Password (myaccount.google.com/apppasswords,
  // requires 2FA enabled) sends to any recipient for free, no domain needed
  // — the standard option for a personal project without its own domain.
  // Optional so boot doesn't require these until the otp module needs them.
  EMAIL_USER: yup.string().email().optional(),
  EMAIL_PASSWORD: yup.string().optional(),
  SENDER_NAME: yup.string().optional(),

  // Dev-only bypass so email OTP verification can be tested without inbox
  // access (no Gmail account needed to click through register -> verify ->
  // login locally). Only ever honored when NODE_ENV === "development" (see
  // modules/otp/service.ts) — setting this in a production .env has no
  // effect by itself, but it should still never be set there, since it's
  // a static, guessable "skip verification" code.
  DEV_MASTER_OTP: yup.string().optional(),
});

export type Env = yup.InferType<typeof envSchema>;

/**
 * Validates process.env against envSchema and returns a typed, immutable config object.
 * Throws (crashing boot) if a required var is missing/malformed — fail fast, not at
 * first use three modules deep, which is how the Refresh_TOKEN_SECRET bug went unnoticed.
 */
function loadEnv(): Env {
  try {
    return envSchema.validateSync(process.env, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      // eslint-disable-next-line no-console -- env validation runs before the logger exists
      console.error("Invalid environment configuration:\n" + error.errors.join("\n"));
    }
    throw error;
  }
}

export const env = loadEnv();
