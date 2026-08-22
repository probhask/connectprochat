import { Server as HttpServer } from "http";
import { Server } from "socket.io";

import { env } from "../config/env";
import { logger } from "../lib/logger";
import { registerConnectionHandlers } from "./handlers/connection";
import { registerConversationHandlers } from "./handlers/conversation";
import { registerMessageHandlers } from "./handlers/message";
import { setIo } from "./ioInstance";
import { markUserOffline, removeActiveSocket } from "./presence";
import { AppServer, AppSocket } from "./types";

/**
 * Actually wires Socket.IO into the HTTP server — the pre-revamp app.ts had
 * `createServer(app)`/`initSocket(httpServer)` commented out and called
 * bare `app.listen(...)` instead, so no Socket.IO server has been running
 * at all (this isn't "fix the room bug", the whole thing was off).
 */
export function initSocket(httpServer: HttpServer): AppServer {
  const io: AppServer = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    },
  });

  io.on("connection", (socket: AppSocket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    registerConnectionHandlers(socket);
    registerConversationHandlers(socket);
    registerMessageHandlers(io, socket);

    socket.on("disconnect", async () => {
      const result = removeActiveSocket(socket.id);
      if (!result) return;

      logger.debug(`Socket disconnected: ${socket.id} (user ${result.userId})`);
      if (result.wasLastSocket) {
        try {
          await markUserOffline(result.userId);
        } catch (error) {
          logger.error(`Failed to mark user ${result.userId} offline`, error);
        }
      }
    });
  });

  setIo(io);
  return io;
}
