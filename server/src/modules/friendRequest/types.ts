import { InferType } from "yup";

import {
  SAcceptFriendRequest,
  SCancelFriendRequest,
  SListFriendRequestsQuery,
  SSendFriendRequest,
} from "./schemas";

export type TListFriendRequestsQuery = InferType<typeof SListFriendRequestsQuery>;
export type TSendFriendRequest = InferType<typeof SSendFriendRequest>;
export type TAcceptFriendRequest = InferType<typeof SAcceptFriendRequest>;
export type TCancelFriendRequest = InferType<typeof SCancelFriendRequest>;
