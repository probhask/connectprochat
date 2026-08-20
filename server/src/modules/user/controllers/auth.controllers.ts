import jwt from "jsonwebtoken";

import { asyncWrapper } from "../../../lib/async-wrapper";
import { ApiError } from "../../../lib/api-error";
import { env } from "../../../config/env";
import { errorResponse, successResponse } from "../../../lib/response-handlers";
import { runTransaction } from "../../../lib/transaction";
import { OtpService } from "../../otp/service";
import {
  AuthErrorCode,
  CLEAR_REFRESH_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from "../constants";
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  sanitizeUserForResponse,
  verifyPassword,
} from "../helpers";
import { SLogin, SRegister } from "../schemas";
import * as userService from "../service";

const otpService = new OtpService();

/**
 * Registers a new (unverified) account and sends an email OTP. No tokens are
 * issued here — the client must complete OTP verification before it can log
 * in. Replaces the pre-revamp flow that issued tokens immediately with no
 * email ownership check at all.
 * @route POST /api/auth/register
 * @body SRegister — { username, email, password }
 * @auth none
 */
export const register = asyncWrapper(
  async (req, res, { body }) => {
    const existing = await runTransaction((tx) =>
      userService.findUserByEmail(tx, body.email)
    );
    if (existing) {
      throw new ApiError(409, "User with this email already exists");
    }

    const hashedPassword = await hashPassword(body.password);
    const user = await runTransaction((tx) =>
      userService.createUser(tx, {
        username: body.username,
        email: body.email,
        hashedPassword,
      })
    );

    // Email send is intentionally outside the transaction — see otp/service.ts.
    await otpService.sendEmailOtp(user.email);

    return successResponse(res, {
      status: 201,
      message: "Registered successfully. Check your email for a verification code.",
      data: { email: user.email },
    });
  },
  { body: SRegister }
);

/**
 * Logs a verified user in. Unverified accounts get a typed 403 so the
 * client can route straight to OTP entry instead of a generic auth error.
 * @route POST /api/auth/login
 * @body SLogin — { email, password }
 * @auth none
 */
export const login = asyncWrapper(
  async (req, res, { body }) => {
    const user = await runTransaction((tx) => userService.findUserByEmail(tx, body.email));
    if (!user) throw new ApiError(401, "Invalid email or password");

    const isMatch = await verifyPassword(body.password, user.password);
    if (!isMatch) throw new ApiError(401, "Invalid email or password");

    if (!user.isVerified) {
      return errorResponse(res, {
        status: 403,
        message: "Verify your email before logging in",
        errors: { code: AuthErrorCode.EMAIL_NOT_VERIFIED },
      });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    await runTransaction(async (tx) => {
      await userService.setRefreshToken(tx, user._id.toString(), refreshToken);
      await userService.setOnlineStatus(tx, user._id.toString(), true);
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    return successResponse(res, {
      message: "Logged in successfully",
      data: { ...sanitizeUserForResponse(user), accessToken },
    });
  },
  { body: SLogin }
);

/**
 * Issues a fresh access token from the refresh-token cookie.
 * @route GET /api/auth/refresh
 * @auth none — the refresh token cookie IS the credential here
 */
export const refresh = asyncWrapper(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
  if (!refreshToken) throw new ApiError(401, "Refresh token not found");

  const foundUser = await runTransaction((tx) =>
    userService.findUserByRefreshToken(tx, refreshToken)
  );
  if (!foundUser) throw new ApiError(403, "Invalid refresh token");

  let payload: { id: string };
  try {
    payload = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as { id: string };
  } catch {
    throw new ApiError(403, "Invalid refresh token");
  }
  if (payload.id !== foundUser._id.toString()) {
    throw new ApiError(403, "Invalid refresh token");
  }

  const accessToken = generateAccessToken(foundUser._id.toString());
  return successResponse(res, { message: "Token refreshed", data: { accessToken } });
});

/**
 * Logs the authenticated user out: clears their refresh token + cookie.
 * @route POST /api/auth/logout
 * @auth required — verifyJWT (acting user comes from req.userId, never the body)
 */
export const logout = asyncWrapper(async (req, res) => {
  const userId = req.userId;
  if (!userId) throw new ApiError(401, "Not authenticated");

  await runTransaction(async (tx) => {
    await userService.setRefreshToken(tx, userId, "");
    await userService.setOnlineStatus(tx, userId, false);
  });

  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, CLEAR_REFRESH_TOKEN_COOKIE_OPTIONS);
  return successResponse(res, { message: "Logged out successfully" });
});
