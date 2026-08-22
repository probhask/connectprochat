import { Resend } from "resend";

import { env } from "../../../config/env";
import { ApiError } from "../../api-error";

/** Thin Resend wrapper — mirrors GG_BE's EmailService. Free tier, no card required. */
export class EmailService {
  private resend: Resend;
  private defaultFrom: string;

  constructor() {
    if (!env.RESEND_API_KEY) {
      throw new ApiError(500, "Email service is not configured (RESEND_API_KEY missing)");
    }
    if (!env.SENDER_EMAIL) {
      throw new ApiError(500, "Email service is not configured (SENDER_EMAIL missing)");
    }
    this.resend = new Resend(env.RESEND_API_KEY);
    this.defaultFrom = env.SENDER_NAME
      ? `${env.SENDER_NAME} <${env.SENDER_EMAIL}>`
      : env.SENDER_EMAIL;
  }

  /** Sends the OTP verification email. */
  async sendOtpEmail(to: string, otp: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.defaultFrom,
        to,
        subject: "Verify your Connect+ account",
        html: otpEmailTemplate(otp),
      });
    } catch (error) {
      throw new ApiError(
        500,
        error instanceof Error ? `Failed to send email: ${error.message}` : "Failed to send email"
      );
    }
  }
}

function otpEmailTemplate(otp: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Verify your Connect+ account</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
      <p>This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>
    </div>
  `;
}
