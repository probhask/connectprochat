import { ApiError } from "../../lib/api-error";
import { EmailService } from "../../lib/services/email/service";
import { OtpStoreService } from "../../lib/services/otp/service";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { runTransaction } from "../../lib/transaction";

/**
 * Orchestrates OTP send/verify for email. Deliberately does NOT take a
 * caller-supplied `tx` — sending an email is an external I/O side effect
 * that must not live inside someone else's Mongo transaction (a transaction
 * retry would risk sending the email twice, and holding the transaction
 * open across an external HTTP call is bad practice). Callers (e.g.
 * register) commit their own transaction first, then call this separately.
 */
export class OtpService {
  private otpStore = new OtpStoreService();
  private emailService = new EmailService();

  /** Generates, stores, and emails a fresh OTP for the given address. */
  async sendEmailOtp(email: string): Promise<void> {
    const otp = await runTransaction((tx) => this.otpStore.createOtp(tx, { email }));
    // logger.debug is a no-op outside NODE_ENV=development (see lib/logger.ts) —
    // this exists purely so a dev can read the code off the server console
    // instead of needing real inbox access while testing locally.
    logger.debug(`Generated email OTP for ${email}: ${otp}`);
    await this.emailService.sendOtpEmail(email, otp);
  }

  /**
   * Verifies + consumes the OTP, then marks the matching User as verified.
   *
   * Dev-only bypass: if NODE_ENV=development and DEV_MASTER_OTP is set in
   * .env, submitting that value instead of the real emailed code also
   * passes — lets a developer click through register -> verify -> login
   * locally without needing inbox access. Never active outside development,
   * regardless of what's in a deployed .env (belt-and-suspenders: the var
   * itself also should never be set in a production environment).
   */
  async verifyEmailOtp(email: string, otp: string): Promise<void> {
    const isMasterOtp =
      env.NODE_ENV === "development" && !!env.DEV_MASTER_OTP && otp === env.DEV_MASTER_OTP;

    await runTransaction(async (tx) => {
      if (isMasterOtp) {
        const user = await tx.user.findOne({ email });
        if (!user) throw new ApiError(400, "Invalid OTP");
      } else {
        await this.otpStore.verifyOtp(tx, { email }, otp);
      }
      await tx.user.updateOne({ email }, { $set: { isVerified: true } });
    });
  }
}
