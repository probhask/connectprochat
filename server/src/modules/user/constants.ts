/** Cookie the refresh token is stored under. */
export const REFRESH_TOKEN_COOKIE_NAME = "chat_app_jwt_refresh_token";

export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days — must match REFRESH_TOKEN_EXPIRATION
};

/**
 * Same attributes used to *set* the cookie must be used to *clear* it — a
 * sameSite mismatch here is exactly the audit's clearRefreshToken finding
 * (was "lax" while login set "none", so logout didn't reliably clear it).
 */
export const CLEAR_REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
};

export const AuthErrorCode = {
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
} as const;
