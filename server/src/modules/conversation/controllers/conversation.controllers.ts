import { asyncWrapper } from "../../../lib/async-wrapper";
import { successResponse } from "../../../lib/response-handlers";
import { runTransaction } from "../../../lib/transaction";
import {
  SConversationIdParams,
  SCreateConversation,
  SDirectConversationParams,
  SParticipantIds,
} from "../schemas";
import * as conversationService from "../service";

/**
 * Fetches a conversation by id. Caller must be a participant.
 * @route GET /api/conversation/:id
 * @params SConversationIdParams — { id }
 * @auth required — verifyJWT
 */
export const getConversation = asyncWrapper(
  async (req, res, { params }) => {
    const userId = req.userId!;
    const conversation = await runTransaction((tx) =>
      conversationService.getConversationById(tx, params.id, userId)
    );
    return successResponse(res, { data: conversation });
  },
  { params: SConversationIdParams }
);

/**
 * Finds or creates the 1:1 conversation between the caller and another
 * (friend) user.
 * @route GET /api/conversation/direct/:otherUserId
 * @params SDirectConversationParams — { otherUserId }
 * @auth required — verifyJWT
 */
export const getOrCreateDirectConversation = asyncWrapper(
  async (req, res, { params }) => {
    const userId = req.userId!;
    const conversation = await runTransaction((tx) =>
      conversationService.getOrCreateDirectConversation(tx, userId, params.otherUserId)
    );
    return successResponse(res, { data: conversation });
  },
  { params: SDirectConversationParams }
);

/**
 * Creates a group (or direct) conversation. The caller is always included
 * in participants regardless of what the client sends.
 * @route POST /api/conversation
 * @body SCreateConversation — { participantIds, isGroupChat, groupName? }
 * @auth required — verifyJWT
 */
export const createConversation = asyncWrapper(
  async (req, res, { body }) => {
    const userId = req.userId!;
    const conversation = await runTransaction((tx) =>
      conversationService.createConversation(
        tx,
        userId,
        body.participantIds,
        body.isGroupChat,
        body.groupName
      )
    );
    return successResponse(res, { status: 201, data: conversation });
  },
  { body: SCreateConversation }
);

/**
 * Deletes a conversation and all its messages/media. Caller must be a
 * participant.
 * @route DELETE /api/conversation/:id
 * @params SConversationIdParams — { id }
 * @auth required — verifyJWT
 */
export const deleteConversation = asyncWrapper(
  async (req, res, { params }) => {
    const userId = req.userId!;
    await runTransaction((tx) =>
      conversationService.deleteConversation(tx, params.id, userId)
    );
    return successResponse(res, {
      message: "Conversation and related messages deleted successfully",
    });
  },
  { params: SConversationIdParams }
);

/**
 * Adds participants to a group conversation. Caller must already be a
 * participant.
 * @route PUT /api/conversation/:id/participants
 * @params SConversationIdParams — { id }
 * @body SParticipantIds — { participantIds }
 * @auth required — verifyJWT
 */
export const addParticipants = asyncWrapper(
  async (req, res, { params, body }) => {
    const userId = req.userId!;
    const conversation = await runTransaction((tx) =>
      conversationService.addParticipants(tx, params.id, userId, body.participantIds)
    );
    return successResponse(res, {
      message: "Participants added successfully",
      data: conversation,
    });
  },
  { params: SConversationIdParams, body: SParticipantIds }
);

/**
 * Removes participants from a group conversation. Caller must be a
 * participant.
 * @route DELETE /api/conversation/:id/participants
 * @params SConversationIdParams — { id }
 * @body SParticipantIds — { participantIds }
 * @auth required — verifyJWT
 */
export const removeParticipants = asyncWrapper(
  async (req, res, { params, body }) => {
    const userId = req.userId!;
    const conversation = await runTransaction((tx) =>
      conversationService.removeParticipants(tx, params.id, userId, body.participantIds)
    );
    return successResponse(res, {
      message: "Participants removed successfully",
      data: conversation,
    });
  },
  { params: SConversationIdParams, body: SParticipantIds }
);

/**
 * Returns the caller's chat list (last message + other-participant preview
 * per conversation).
 * @route GET /api/conversation/chat-list
 * @auth required — verifyJWT
 */
export const getChatList = asyncWrapper(async (req, res) => {
  const userId = req.userId!;
  const conversations = await runTransaction((tx) =>
    conversationService.getChatList(tx, userId)
  );
  return successResponse(res, { data: conversations });
});
