import nodemailer, { Transporter } from "nodemailer";

import { env } from "../../../config/env";
import { ApiError } from "../../api-error";
import { logger } from "../../logger";

/**
 * Nodemailer over Gmail SMTP — swapped in for Resend. Resend requires
 * verifying a domain you own before it will send to arbitrary recipients
 * (a personal Gmail address can never be "verified" as a sending domain,
 * since verification proves DNS control, and nobody but Google controls
 * gmail.com's DNS); this app has no domain of its own. Gmail SMTP + an
 * account App Password sends to any recipient for free with no domain
 * requirement at all — the standard option here.
 */
export class EmailService {
  private transporter: Transporter;
  private defaultFrom: string;

  constructor() {
    if (!env.EMAIL_USER) {
      throw new ApiError(500, "Email service is not configured (EMAIL_USER missing)");
    }
    if (!env.EMAIL_PASSWORD) {
      throw new ApiError(500, "Email service is not configured (EMAIL_PASSWORD missing)");
    }
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    });
    this.defaultFrom = env.SENDER_NAME
      ? `${env.SENDER_NAME} <${env.EMAIL_USER}>`
      : env.EMAIL_USER;
  }

  /** Sends the OTP verification email. */
  async sendOtpEmail(to: string, otp: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.defaultFrom,
        to,
        subject: "Verify your Connect+ account",
        html: otpEmailTemplate(otp),
      });
      logger.info(`OTP email sent to ${to} (messageId: ${info.messageId})`);
    } catch (error) {
      logger.error(`Failed to send OTP email to ${to}`, error);
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
