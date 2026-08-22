import { asyncWrapper } from "../../../lib/async-wrapper";
import { successResponse } from "../../../lib/response-handlers";
import { runTransaction } from "../../../lib/transaction";
import { SocketEvent } from "../../../sockets/constants";
import { emitToConversation } from "../../../sockets/helpers";
import { getIo } from "../../../sockets/ioInstance";
import {
  SConversationIdParams,
  SDeleteMessages,
  SGetMessagesQuery,
  SSendMessage,
  SUpdateMessageStatus,
} from "../schemas";
import * as conversationService from "../service";

/**
 * Paginated message history for a conversation. Caller must be a
 * participant.
 * @route GET /api/conversation/:id/messages
 * @params SConversationIdParams — { id }
 * @query SGetMessagesQuery — { page?, limit? }
 * @auth required — verifyJWT
 */
export const getMessages = asyncWrapper(
  async (req, res, { params, query }) => {
    const userId = req.userId!;
    const result = await runTransaction((tx) =>
      conversationService.getMessages(tx, params.id, userId, query)
    );
    return successResponse(res, { data: result });
  },
  { params: SConversationIdParams, query: SGetMessagesQuery }
);

/**
 * Sends a message. Sender is always the caller.
 *
 * Also broadcasts the new message over the conversation's socket room
 * (same event, same helper the socket SEND_MESSAGE handler uses — see
 * sockets/handlers/message.ts) so participants who didn't send it get it
 * in real time. Sending is REST-first (proper HTTP status/error
 * semantics, works the same whether or not the socket is connected);
 * this just makes REST-sent messages reach everyone live too, instead of
 * only ones sent through the socket path.
 * @route POST /api/conversation/:id/messages
 * @params SConversationIdParams — { id }
 * @body SSendMessage — { text }
 * @auth required — verifyJWT
 */
export const sendMessage = asyncWrapper(
  async (req, res, { params, body }) => {
    const senderId = req.userId!;
    const message = await runTransaction((tx) =>
      conversationService.sendMessage(tx, params.id, senderId, body.text)
    );
    const io = getIo();
    if (io) emitToConversation(io, params.id, SocketEvent.MESSAGE_RECEIVED, message);
    return successResponse(res, { status: 201, data: message });
  },
  { params: SConversationIdParams, body: SSendMessage }
);

/**
 * Deletes the caller's own messages (any conversation).
 * @route DELETE /api/conversation/messages
 * @body SDeleteMessages — { messageIds }
 * @auth required — verifyJWT
 */
export const deleteMessages = asyncWrapper(
  async (req, res, { body }) => {
    const userId = req.userId!;
    const deletedCount = await runTransaction((tx) =>
      conversationService.deleteMessages(tx, body.messageIds, userId)
    );
    return successResponse(res, { message: `${deletedCount} message(s) deleted successfully` });
  },
  { body: SDeleteMessages }
);

/**
 * Marks messages as received/read for the caller.
 * @route PUT /api/conversation/:id/messages/status
 * @params SConversationIdParams — { id }
 * @body SUpdateMessageStatus — { messageIds, isReceived, isRead }
 * @auth required — verifyJWT
 */
export const updateMessageStatus = asyncWrapper(
  async (req, res, { params, body }) => {
    const userId = req.userId!;
    await runTransaction((tx) =>
      conversationService.updateMessageStatus(
        tx,
        params.id,
        body.messageIds,
        userId,
        body.isReceived,
        body.isRead
      )
    );
    return successResponse(res, { message: "Message status successfully updated" });
  },
  { params: SConversationIdParams, body: SUpdateMessageStatus }
);
