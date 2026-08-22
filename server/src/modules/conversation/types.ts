import { InferType } from "yup";

import {
  SConversationIdParams,
  SCreateConversation,
  SDeleteMessages,
  SDirectConversationParams,
  SGetMessagesQuery,
  SParticipantIds,
  SSendMessage,
  SUpdateMessageStatus,
} from "./schemas";

export type TConversationIdParams = InferType<typeof SConversationIdParams>;
export type TDirectConversationParams = InferType<typeof SDirectConversationParams>;
export type TCreateConversation = InferType<typeof SCreateConversation>;
export type TParticipantIds = InferType<typeof SParticipantIds>;
export type TGetMessagesQuery = InferType<typeof SGetMessagesQuery>;
export type TSendMessage = InferType<typeof SSendMessage>;
export type TDeleteMessages = InferType<typeof SDeleteMessages>;
export type TUpdateMessageStatus = InferType<typeof SUpdateMessageStatus>;
