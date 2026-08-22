import { asyncWrapper } from "../../lib/async-wrapper";
import { successResponse } from "../../lib/response-handlers";
import { runTransaction } from "../../lib/transaction";
import { SSendEmailOtp, SVerifyEmailOtp } from "./schemas";
import { OtpService } from "./service";
import {
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from "../user/constants";
import {
  generateAccessToken,
  generateRefreshToken,
  sanitizeUserForResponse,
} from "../user/helpers";
import { setOnlineStatus, setRefreshToken } from "../user/service";

const otpService = new OtpService();

/**
 * Sends (or resends) an email OTP for account verification.
 * @route POST /api/otp/email/send
 * @body SSendEmailOtp — { email }
 * @auth none — used both right after registration and from a "resend code" UI
 */
export const sendEmailOtp = asyncWrapper(
  async (req, res, { body }) => {
    await otpService.sendEmailOtp(body.email);
    return successResponse(res, { message: "OTP sent successfully" });
  },
  { body: SSendEmailOtp }
);

/**
 * Verifies an email OTP, marks the matching account as verified, and logs
 * the user straight in (same token/cookie issuance as POST /auth/login) —
 * proving email ownership via OTP is at least as strong a credential as
 * the password, so there's no reason to make a just-verified user turn
 * around and log in again by hand.
 * @route POST /api/otp/email/verify
 * @body SVerifyEmailOtp — { email, otp }
 * @auth none — this IS the verification step, called before login is possible
 */
export const verifyEmailOtp = asyncWrapper(
  async (req, res, { body }) => {
    const user = await otpService.verifyEmailOtp(body.email, body.otp);

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    await runTransaction(async (tx) => {
      await setRefreshToken(tx, user._id.toString(), refreshToken);
      await setOnlineStatus(tx, user._id.toString(), true);
    });

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    return successResponse(res, {
      message: "Email verified — you're logged in",
      data: { ...sanitizeUserForResponse(user), accessToken },
    });
  },
  { body: SVerifyEmailOtp }
);
