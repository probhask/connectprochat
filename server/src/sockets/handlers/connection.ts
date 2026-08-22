import { logger } from "../../lib/logger";
import { runTransaction } from "../../lib/transaction";
import * as conversationService from "../../modules/conversation/service";
import { verifySocketJWT } from "../../utils/verifySocketJWT";
import { SocketEvent } from "../constants";
import { addActiveSocket, markUserOnline } from "../presence";
import { AppSocket } from "../types";

/**
 * Handles the client's `authenticate` handshake — matches the real emit now
 * wired up client-side in SocketContext.tsx (was previously a commented-out
 * no-op, so this handler existed server-side but nothing ever called it).
 * Every other handler requires `socket.data.userId` to be set here first.
 */
export function registerConnectionHandlers(socket: AppSocket): void {
  socket.on(SocketEvent.AUTHENTICATE, async (token: string) => {
    const userId = await verifySocketJWT(token);
    if (!userId) {
      socket.emit(SocketEvent.AUTH_ERROR, "Invalid or expired token");
      socket.disconnect(true);
      return;
    }

    socket.data.userId = userId;
    addActiveSocket(userId, socket.id);
    // A personal room named by the user's own id — every socket of theirs
    // (multiple tabs/devices) joins it, so a user-scoped event (friend
    // request received/accepted; anything not tied to a specific
    // conversation) can be delivered with io.to(userId).emit(...) instead
    // of every handler having to look up getActiveSocketIds itself.
    socket.join(userId);

    // Also join every conversation this user is already a participant in
    // — not just the one they open. Without this, a socket only became a
    // member of a conversation's room when that specific conversation was
    // opened client-side, so io.to(conversationId).emit(MESSAGE_RECEIVED)
    // only ever reached whichever one chat happened to be open; the chat
    // list's live last-message preview (and everything else) needed a
    // manual reload for every OTHER conversation. A newly created
    // conversation still gets joined the existing way, when it's opened.
    try {
      const conversationIds = await runTransaction((tx) =>
        conversationService.getUserConversationIds(tx, userId)
      );
      socket.join(conversationIds);
    } catch (error) {
      logger.error(`Failed to join ${userId}'s conversation rooms`, error);
    }

    try {
      await markUserOnline(userId);
    } catch (error) {
      logger.error(`Failed to mark user ${userId} online`, error);
    }

    socket.emit(SocketEvent.AUTHENTICATED, { userId });
    logger.debug(`Socket ${socket.id} authenticated as user ${userId}`);
  });
}
