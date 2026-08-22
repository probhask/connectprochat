import { TxContext } from "../../lib/services/factory/tx-context";
import { ApiError } from "../../lib/api-error";
import { IFriendRequest } from "../../models/friendRequest";
import * as userService from "../user/service";
import { FriendRequestStatus, RequestType } from "./constants";

const PARTICIPANT_POPULATE = [
  {
    path: "sender",
    select: "username _id profile_picture",
    populate: { path: "profile_picture", model: "Upload", select: "path _id mimetype originalName fileName fullPath" },
  },
  {
    path: "receiver",
    select: "username _id profile_picture",
    populate: { path: "profile_picture", model: "Upload", select: "path _id mimetype originalName fileName fullPath" },
  },
];

/**
 * Lists the caller's pending friend requests, optionally filtered to only
 * ones they sent (RequestType.SEND) or only ones they received (RECEIVE).
 * Always scoped to the caller — the pre-revamp version took an arbitrary
 * `userId` query param, letting any authenticated user view anyone else's
 * pending requests.
 */
export async function listFriendRequests(
  tx: TxContext,
  userId: string,
  requestType?: string
) {
  // Query only the direction actually needed instead of always fetching
  // both and discarding half in JS (found in code review).
  if (requestType === RequestType.SEND) {
    const { data } = await tx.friendRequest.findMany(
      { sender: userId, status: FriendRequestStatus.PENDING },
      { populate: PARTICIPANT_POPULATE }
    );
    return { sent: data };
  }
  if (requestType === RequestType.RECEIVE) {
    const { data } = await tx.friendRequest.findMany(
      { receiver: userId, status: FriendRequestStatus.PENDING },
      { populate: PARTICIPANT_POPULATE }
    );
    return { received: data };
  }

  const { data: requests } = await tx.friendRequest.findMany(
    {
      $or: [{ sender: userId }, { receiver: userId }],
      status: FriendRequestStatus.PENDING,
    },
    { populate: PARTICIPANT_POPULATE }
  );
  const sent = requests.filter((r) => r.sender._id.toString() === userId);
  const received = requests.filter((r) => r.sender._id.toString() !== userId);
  return { sent, received };
}

/**
 * Creates a pending friend request between two users, rejecting duplicates
 * in either direction.
 * @throws ApiError 409 if a pending request already exists in either direction
 * @throws ApiError 400 if sender and receiver are the same user
 */
export async function createFriendRequest(
  tx: TxContext,
  senderId: string,
  receiverId: string
) {
  if (senderId === receiverId) {
    throw new ApiError(400, "You can't send a friend request to yourself");
  }

  const receiverExists = await userService.findUserById(tx, receiverId);
  if (!receiverExists) throw new ApiError(404, "User not found");

  const existing = await tx.friendRequest.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
    status: FriendRequestStatus.PENDING,
  });
  if (existing) throw new ApiError(409, "Friend request already exists");

  // Mongoose casts a string id to ObjectId at runtime; the strict
  // Partial<IFriendRequest> shape just doesn't model that leniency at
  // compile time (same pattern as otp/service.ts's createOtp).
  const request = await tx.friendRequest.create({
    sender: senderId,
    receiver: receiverId,
    status: FriendRequestStatus.PENDING,
  } as unknown as Partial<IFriendRequest>);
  const populated = await tx.friendRequest.findOne(
    { _id: request._id },
    { populate: PARTICIPANT_POPULATE }
  );
  return populated;
}

/**
 * Accepts a pending friend request: adds each user to the other's friends
 * list (via user/service.ts's addFriendPair, not a direct User write — this
 * module owns FriendRequest, not User) and removes the request.
 * @throws ApiError 404 if the request doesn't exist
 * @throws ApiError 403 if the caller isn't the request's receiver — the
 *   pre-revamp version had no ownership check here at all.
 */
export async function acceptFriendRequest(
  tx: TxContext,
  requestId: string,
  actingUserId: string
) {
  const request = await tx.friendRequest.findOne({ _id: requestId });
  if (!request) throw new ApiError(404, "Friend request not found");
  if (request.receiver.toString() !== actingUserId) {
    throw new ApiError(403, "Not authorized to accept this request");
  }

  const originalSenderId = request.sender.toString();

  await userService.addFriendPair(tx, originalSenderId, request.receiver.toString());
  await tx.friendRequest.deleteOne({ _id: requestId });

  // Both sides need the OTHER party's user doc as their new "friend" —
  // the acceptor's response shows the original sender, and the original
  // sender's real-time push (see controllers.ts) shows the acceptor.
  const [friendForAcceptor, friendForOriginalSender] = await Promise.all([
    userService.findUserById(tx, originalSenderId),
    userService.findUserById(tx, actingUserId),
  ]);

  return { friendForAcceptor, friendForOriginalSender, originalSenderId, requestId };
}

/**
 * Cancels/declines a pending friend request. Either party (sender or
 * receiver) may cancel — the pre-revamp version let ANY authenticated user
 * delete ANY friend request by id, with no ownership check at all.
 * @throws ApiError 404 if the request doesn't exist
 * @throws ApiError 403 if the caller is neither the sender nor the receiver
 */
export async function cancelFriendRequest(
  tx: TxContext,
  requestId: string,
  actingUserId: string
) {
  const request = await tx.friendRequest.findOne({ _id: requestId });
  if (!request) throw new ApiError(404, "Friend request not found");

  const isParticipant =
    request.sender.toString() === actingUserId ||
    request.receiver.toString() === actingUserId;
  if (!isParticipant) {
    throw new ApiError(403, "Not authorized to cancel this request");
  }

  await tx.friendRequest.deleteOne({ _id: requestId });
}

/**
 * User ids involved in any pending request with `userId`, in either
 * direction — composed into user/service.ts's exploreUsers() exclusion list
 * so people you already have a pending request with don't show up in
 * discovery.
 */
export async function getPendingRequestUserIds(
  tx: TxContext,
  userId: string
): Promise<string[]> {
  const { data: requests } = await tx.friendRequest.findMany({
    $or: [{ sender: userId }, { receiver: userId }],
    status: FriendRequestStatus.PENDING,
  });
  return requests.map((r) =>
    r.sender.toString() === userId ? r.receiver.toString() : r.sender.toString()
  );
}
