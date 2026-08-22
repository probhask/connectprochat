import { Server } from "socket.io";

import { runTransaction } from "../lib/transaction";
import { assertIsParticipant as assertIsConversationParticipant } from "../modules/conversation/service";
import { SocketEvent } from "./constants";

/**
 * Every handler that needs to push a conversation-scoped event funnels
 * through this — no handler inlines `io.to(...).emit(...)` itself. Fixes
 * the pre-revamp design where message delivery used `socket.broadcast.emit`
 * (global broadcast to every connected socket, not just the room), making
 * the `joinConversation`/`socket.join` call effectively decorative.
 */
export function emitToConversation(
  io: Server,
  conversationId: string,
  event: SocketEvent,
  payload: unknown
): void {
  io.to(conversationId).emit(event, payload);
}

/**
 * Every handler that needs to verify conversation membership funnels
 * through this, reusing the exact same rule the REST endpoints enforce
 * (modules/conversation/service.ts's assertIsParticipant) — not a
 * re-implemented, potentially-drifting copy of the same check.
 * Returns true/false instead of throwing, since a socket handler isn't
 * inside asyncWrapper's try/catch to convert an ApiError into an HTTP
 * response.
 */
export async function assertIsParticipant(
  conversationId: string,
  userId: string
): Promise<boolean> {
  try {
    await runTransaction((tx) =>
      assertIsConversationParticipant(tx, conversationId, userId)
    );
    return true;
  } catch {
    return false;
  }
}
