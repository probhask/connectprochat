import { EmailService } from "../../lib/services/email/service";
import { OtpStoreService } from "../../lib/services/otp/service";
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
    await this.emailService.sendOtpEmail(email, otp);
  }

  /** Verifies + consumes the OTP, then marks the matching User as verified. */
  async verifyEmailOtp(email: string, otp: string): Promise<void> {
    await runTransaction(async (tx) => {
      await this.otpStore.verifyOtp(tx, { email }, otp);
      await tx.user.updateOne({ email }, { $set: { isVerified: true } });
    });
  }
}
