import { AppServer } from "./types";

/**
 * Module-level handle to the running Socket.IO server, set once by
 * initSocket() at boot. Exists so REST controllers (which never see `io`
 * otherwise — it's constructed in server.ts, one layer above app.ts) can
 * still broadcast a room event after a plain HTTP request, e.g.
 * modules/conversation/controllers/message.controllers.ts's REST
 * sendMessage also calling emitToConversation so a message sent over
 * REST reaches other participants in real time, not just ones sent
 * through the socket SEND_MESSAGE handler.
 */
let ioInstance: AppServer | null = null;

export function setIo(io: AppServer): void {
  ioInstance = io;
}

/** Null until initSocket() has run — every caller must handle that case. */
export function getIo(): AppServer | null {
  return ioInstance;
}
