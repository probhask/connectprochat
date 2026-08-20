import { ApiError } from "../../lib/api-error";
import { logger } from "../../lib/logger";
import { runTransaction } from "../../lib/transaction";
import * as conversationService from "../../modules/conversation/service";
import { SocketEvent } from "../constants";
import { emitToConversation } from "../helpers";
import { AppServer, AppSocket } from "../types";

interface SendMessagePayload {
  conversationId: string;
  text: string;
}

/**
 * Persists the message through the SAME service function the REST
 * `POST /api/conversation/:id/messages` endpoint uses
 * (modules/conversation/service.ts's sendMessage) — no separate business
 * logic duplicated here — then broadcasts it to the conversation's room.
 * Fixes the pre-revamp design where the socket handler read straight off
 * `Conversation.findById` and broadcast to every connected socket instead
 * of the room, with `sender`/participants trusted from the client payload
 * rather than the authenticated socket.
 */
export function registerMessageHandlers(io: AppServer, socket: AppSocket): void {
  socket.on(SocketEvent.SEND_MESSAGE, async (payload: SendMessagePayload) => {
    const senderId = socket.data.userId;
    if (!senderId) {
      socket.emit(SocketEvent.ERROR, "Authenticate before sending a message");
      return;
    }

    try {
      const message = await runTransaction((tx) =>
        conversationService.sendMessage(tx, payload.conversationId, senderId, payload.text)
      );
      emitToConversation(io, payload.conversationId, SocketEvent.MESSAGE_RECEIVED, message);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to send message";
      socket.emit(SocketEvent.ERROR, message);
      if (!(error instanceof ApiError)) {
        logger.error("Unexpected error in sendMessage socket handler", error);
      }
    }
  });
}
