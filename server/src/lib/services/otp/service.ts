import bcrypt from "bcrypt";

import { ApiError } from "../../api-error";
import { TxContext } from "../factory/tx-context";
import { generateOtp } from "./helper";

export const OTP_EXPIRATION_MINUTES = 5;

interface OtpCondition {
  email?: string;
  userId?: string;
}

/**
 * Generic OTP create/verify store (not email-specific — mirrors GG_BE's
 * OtpStoreService). The OTP itself is hashed with bcrypt before it's stored
 * (same "never plaintext at rest" guarantee as GG_BE's encrypt/decrypt
 * helper, using bcrypt — already a project dependency — instead of adding a
 * separate symmetric-encryption key to manage).
 */
export class OtpStoreService {
  /**
   * Creates or refreshes a pending OTP for the given condition; returns the
   * plaintext OTP to send. A single atomic upsert (not findOne-then-write) —
   * two concurrent calls for the same email (e.g. a double-clicked "resend")
   * can't both take a create path and produce two ambiguous pending codes;
   * the unique index on `email` (see models/otp.ts) backs this up.
   */
  async createOtp(tx: TxContext, condition: OtpCondition): Promise<string> {
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    await tx.otp.updateOne(condition, { otp: hashedOtp, expiresAt }, { upsert: true });
    return otp;
  }

  /** Verifies + consumes an OTP; throws ApiError 400 on missing/expired/mismatched OTP. */
  async verifyOtp(tx: TxContext, condition: OtpCondition, otp: string): Promise<void> {
    const otpDoc = await tx.otp.findOne(condition);
    if (!otpDoc) throw new ApiError(400, "Invalid OTP");

    if (otpDoc.expiresAt.getTime() < Date.now()) {
      await tx.otp.deleteOne(condition);
      throw new ApiError(400, "OTP expired");
    }

    const isMatch = await bcrypt.compare(otp, otpDoc.otp);
    if (!isMatch) throw new ApiError(400, "Invalid OTP");

    await tx.otp.deleteOne(condition);
  }
}
