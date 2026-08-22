import * as yup from "yup";

import { objectIdSchema, objectIdTest } from "../../lib/validation/objectId";

export const SConversationIdParams = yup.object({
  id: objectIdSchema(),
});

export const SDirectConversationParams = yup.object({
  otherUserId: objectIdSchema(),
});

export const SCreateConversation = yup.object({
  participantIds: yup
    .array()
    .of(yup.string().required().test(objectIdTest))
    .min(1)
    .required(),
  isGroupChat: yup.boolean().default(false),
  groupName: yup.string().trim().when("isGroupChat", {
    is: true,
    then: (schema) => schema.required("groupName is required for group chats"),
    otherwise: (schema) => schema.optional(),
  }),
});

export const SParticipantIds = yup.object({
  participantIds: yup
    .array()
    .of(yup.string().required().test(objectIdTest))
    .min(1)
    .required(),
});

export const SGetMessagesQuery = yup.object({
  page: yup.number().integer().positive().optional(),
  limit: yup.number().integer().positive().max(100).optional(),
});

export const SSendMessage = yup.object({
  text: yup.string().trim().max(5000).required(),
});

export const SDeleteMessages = yup.object({
  messageIds: yup
    .array()
    .of(yup.string().required().test(objectIdTest))
    .min(1)
    .required(),
});

export const SUpdateMessageStatus = yup.object({
  messageIds: yup
    .array()
    .of(yup.string().required().test(objectIdTest))
    .min(1)
    .required(),
  isReceived: yup.boolean().required(),
  isRead: yup.boolean().required(),
});
