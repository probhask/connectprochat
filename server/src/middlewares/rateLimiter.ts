import rateLimit from "express-rate-limit";

/**
 * OTP endpoints are the classic brute-force/spam target (guessing a 6-digit
 * code, or spamming "resend" to flood someone's inbox) — see revamp plan
 * Section H. Capped tighter than general auth traffic.
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP requests, try again later" },
});

/** Login/register — cap credential-guessing attempts. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth requests, try again later" },
});
