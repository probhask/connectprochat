import { logger } from "../../lib/logger";
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
    try {
      await markUserOnline(userId);
    } catch (error) {
      logger.error(`Failed to mark user ${userId} online`, error);
    }

    socket.emit(SocketEvent.AUTHENTICATED, { userId });
    logger.debug(`Socket ${socket.id} authenticated as user ${userId}`);
  });
}
