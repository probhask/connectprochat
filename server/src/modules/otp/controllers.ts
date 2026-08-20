import { asyncWrapper } from "../../lib/async-wrapper";
import { successResponse } from "../../lib/response-handlers";
import { SSendEmailOtp, SVerifyEmailOtp } from "./schemas";
import { OtpService } from "./service";

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
 * Verifies an email OTP and marks the matching account as verified.
 * @route POST /api/otp/email/verify
 * @body SVerifyEmailOtp — { email, otp }
 * @auth none — this IS the verification step, called before login is possible
 */
export const verifyEmailOtp = asyncWrapper(
  async (req, res, { body }) => {
    await otpService.verifyEmailOtp(body.email, body.otp);
    return successResponse(res, { message: "OTP verified successfully" });
  },
  { body: SVerifyEmailOtp }
);
