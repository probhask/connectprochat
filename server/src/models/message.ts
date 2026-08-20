import Conversation, { IConversation } from "./conversation";
import mongoose, { Document, ObjectId, Schema } from "mongoose";

import { IUpload } from "./upload";
import { IUser } from "./user";

export interface IMessage extends Document {
  conversationId: IConversation["_id"];
  sender: IUser["_id"];
  text: String;
  media: IUpload["_id"];
  isSent: Boolean;
  status: [
    {
      user: mongoose.Types.ObjectId; //the user receiving the message
      isReceived: Boolean;
      isRead: Boolean;
    }
  ];
  createdAt: Date;
  updateAt: Date;
}

const messageSchema: Schema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
    },
    media: {
      type: Schema.Types.ObjectId,
      ref: "Upload",
      default: null,
    },
    isSent: {
      type: Boolean,
      default: true,
    },
    status: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        isReceived: {
          type: Boolean,
          default: false,
        },
        isRead: {
          type: Boolean,
          default: false,
        },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

// Every message-history fetch filters by conversationId and sorts by recency —
// see revamp plan Section H.
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model<IMessage>("Message", messageSchema);
export default Message;
