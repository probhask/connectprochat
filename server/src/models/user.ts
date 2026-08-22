import mongoose, { Document, Schema } from "mongoose";

import { IUpload } from "./upload";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profile_picture: IUpload["_id"] | null;
  isOnline: boolean;
  isVerified: boolean;
  lastSeen: Date;
  friends: IUser["_id"][];
  createdAt: Date;
  updatedAt: Date;
  refreshToken: string;
}

const userSchema: Schema = new mongoose.Schema(
  {
    // unique: login-by-username (see modules/user/service.ts's
    // findUserByIdentifier) would be ambiguous otherwise.
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profile_picture: {
      type: Schema.Types.ObjectId,
      ref: "Upload",
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
    // Email/OTP-verified — see modules/otp. Unverified accounts can register
    // but cannot log in until this flips true (modules/user/auth.controllers.ts).
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;
