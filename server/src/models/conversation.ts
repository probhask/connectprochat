import mongoose, { Document, Schema } from "mongoose";

import { IUser } from "./user";

export interface IConversation extends Document {
  participants: IUser["_id"][];
  isGroupChat: Boolean;
  groupName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema: Schema = new mongoose.Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isGroupChat: { type: Boolean, default: false },
    groupName: { type: String, default: null },
  },
  { timestamps: true }
);

// Chat-list/participant lookups filter on participants — see revamp plan Section H.
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);

export default Conversation;
