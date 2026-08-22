import * as yup from "yup";
import dotenv from "dotenv";

dotenv.config();

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

  BACKEND_URL: yup.string().url().required("BACKEND_URL is required"),
  FRONTEND_URL: yup.string().url().required("FRONTEND_URL is required"),

  // Provisioned in Phase 0 for the Section G OTP/email-verification feature (Phase 2).
  // Optional for now so Phase 0/1 (no OTP module yet) don't require a Resend account
  // to boot; becomes effectively required once modules/otp lands.
  RESEND_API_KEY: yup.string().optional(),
  SENDER_NAME: yup.string().optional(),
  SENDER_EMAIL: yup.string().email().optional(),
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
