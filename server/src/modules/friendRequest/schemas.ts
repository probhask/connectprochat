import * as yup from "yup";

import { objectIdSchema } from "../../lib/validation/objectId";
import { RequestType } from "./constants";

export const SListFriendRequestsQuery = yup.object({
  requestType: yup
    .string()
    .oneOf([RequestType.SEND, RequestType.RECEIVE])
    .optional(),
});

export const SSendFriendRequest = yup.object({
  receiverId: objectIdSchema(),
});

export const SAcceptFriendRequest = yup.object({
  requestId: objectIdSchema(),
});

export const SCancelFriendRequest = yup.object({
  requestId: objectIdSchema(),
});
