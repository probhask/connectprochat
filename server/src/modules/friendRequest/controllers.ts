import { asyncWrapper } from "../../lib/async-wrapper";
import { successResponse } from "../../lib/response-handlers";
import { runTransaction } from "../../lib/transaction";
import {
  SAcceptFriendRequest,
  SCancelFriendRequest,
  SListFriendRequestsQuery,
  SSendFriendRequest,
} from "./schemas";
import * as friendRequestService from "./service";

/**
 * Lists the caller's own pending friend requests (sent, received, or both).
 * @route GET /api/friendRequest
 * @query SListFriendRequestsQuery — { requestType?: "SEND" | "RECEIVE" }
 * @auth required — verifyJWT
 */
export const listFriendRequests = asyncWrapper(
  async (req, res, { query }) => {
    const userId = req.userId!;
    const result = await runTransaction((tx) =>
      friendRequestService.listFriendRequests(tx, userId, query.requestType)
    );
    return successResponse(res, { data: result });
  },
  { query: SListFriendRequestsQuery }
);

/**
 * Sends a friend request from the caller to another user.
 * @route POST /api/friendRequest/send
 * @body SSendFriendRequest — { receiverId }
 * @auth required — verifyJWT (sender is always req.userId, never client-supplied)
 */
export const sendFriendRequest = asyncWrapper(
  async (req, res, { body }) => {
    const senderId = req.userId!;
    const request = await runTransaction((tx) =>
      friendRequestService.createFriendRequest(tx, senderId, body.receiverId)
    );
    return successResponse(res, { status: 201, data: request });
  },
  { body: SSendFriendRequest }
);

/**
 * Accepts a pending friend request. Only the request's receiver may accept.
 * @route PUT /api/friendRequest
 * @body SAcceptFriendRequest — { requestId }
 * @auth required — verifyJWT
 */
export const acceptFriendRequest = asyncWrapper(
  async (req, res, { body }) => {
    const userId = req.userId!;
    const sender = await runTransaction((tx) =>
      friendRequestService.acceptFriendRequest(tx, body.requestId, userId)
    );
    return successResponse(res, { message: "Friend request accepted", data: { user: sender } });
  },
  { body: SAcceptFriendRequest }
);

/**
 * Cancels (if sender) or declines (if receiver) a pending friend request.
 * @route DELETE /api/friendRequest
 * @body SCancelFriendRequest — { requestId }
 * @auth required — verifyJWT
 */
export const cancelFriendRequest = asyncWrapper(
  async (req, res, { body }) => {
    const userId = req.userId!;
    await runTransaction((tx) =>
      friendRequestService.cancelFriendRequest(tx, body.requestId, userId)
    );
    return successResponse(res, { message: "Friend request cancelled successfully" });
  },
  { body: SCancelFriendRequest }
);
