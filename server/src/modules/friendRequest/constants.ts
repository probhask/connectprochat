export const FriendRequestStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
} as const;
export type FriendRequestStatus =
  (typeof FriendRequestStatus)[keyof typeof FriendRequestStatus];

/** Filters GET /api/friendRequest to only what the caller sent or only what they received. */
export const RequestType = {
  SEND: "SEND",
  RECEIVE: "RECEIVE",
} as const;
export type RequestType = (typeof RequestType)[keyof typeof RequestType];
