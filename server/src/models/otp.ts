import mongoose, { Document, Schema } from "mongoose";

import { IUser } from "./user";

export interface IOtp extends Document {
  email: string;
  userId: IUser["_id"] | null;
  otp: string; // encrypted at rest — see lib/services/otp/service.ts
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema: Schema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// One pending OTP per email at a time. Unique (not just indexed) so that two
// concurrent createOtp() calls for the same email can't both insert — the
// second loses the atomic upsert race with a duplicate-key error instead of
// silently creating a second, ambiguous pending code (see revamp code review).
otpSchema.index({ email: 1 }, { unique: true });
// TTL index: Mongo automatically deletes the document once expiresAt passes,
// so stale/expired OTPs never accumulate.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model<IOtp>("Otp", otpSchema);
export default Otp;
