import { SocketEvent } from "../constants";
import { assertIsParticipant } from "../helpers";
import { AppSocket } from "../types";

/**
 * joinConversation now actually verifies the socket's authenticated user is
 * a participant before joining the Socket.IO room — the pre-revamp version
 * called `socket.join(conversationId)` unconditionally for whatever id the
 * client sent, and message delivery didn't even use rooms (global
 * broadcast), so this check never existed anywhere.
 */
export function registerConversationHandlers(socket: AppSocket): void {
  socket.on(SocketEvent.JOIN_CONVERSATION, async (conversationId: string) => {
    const userId = socket.data.userId;
    if (!userId) {
      socket.emit(SocketEvent.ERROR, "Authenticate before joining a conversation");
      return;
    }

    const isParticipant = await assertIsParticipant(conversationId, userId);
    if (!isParticipant) {
      socket.emit(SocketEvent.ERROR, "Not authorized to join this conversation");
      return;
    }

    socket.join(conversationId);
  });

  socket.on(SocketEvent.LEAVE_CONVERSATION, (conversationId: string) => {
    socket.leave(conversationId);
  });
}
