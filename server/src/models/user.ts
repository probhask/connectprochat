import mongoose, { Document, Schema } from "mongoose";

import { IUpload } from "./upload";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profile_picture: IUpload["_id"] | null;
  isOnline: Boolean;
  friends: IUser["_id"][];
  createdAt: Date;
  updatedAt: Date;
  refreshToken: string;
}
const userSchema: Schema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
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
    lastSeen: {
      type: Date,
      default: Date.now(),
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

// async function testFunc() {
//   const users = await User.find({ password: "Pass@1234" });
//   for (const user of users) {
//     const password = user.password;

//     // Hash the password before saving
//     const hashedPassword = await bcrypt.hash(password, 10);

//     user.password = hashedPassword;
//     await user.save();
//   }
// }
// testFunc();
