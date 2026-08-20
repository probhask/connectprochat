import { runTransaction } from "../lib/transaction";
import * as userService from "../modules/user/service";

interface SocketUser {
  userId: string;
  socketId: string;
}

/**
 * userId -> socketId, one entry per connected socket (a user can have
 * multiple tabs/devices open at once, each with its own socket).
 */
const activeUsers: SocketUser[] = [];

/**
 * Idempotent by socketId — replaces any existing entry for this socket
 * instead of appending a second one. Without this, a socket "authenticate"-ing
 * twice (a duplicate connect event, or re-authenticating with a refreshed
 * token) would leave a ghost entry that disconnect can never clean up (its
 * `.find()` only removes the first match), permanently wedging that user's
 * presence as "online".
 */
export function addActiveSocket(userId: string, socketId: string): void {
  const existingIndex = activeUsers.findIndex((u) => u.socketId === socketId);
  if (existingIndex !== -1) {
    activeUsers[existingIndex] = { userId, socketId };
  } else {
    activeUsers.push({ userId, socketId });
  }
}

/** Removes one socket; returns true if that was the user's LAST active socket. */
export function removeActiveSocket(socketId: string): { userId: string; wasLastSocket: boolean } | null {
  const entry = activeUsers.find((u) => u.socketId === socketId);
  if (!entry) return null;

  activeUsers.splice(activeUsers.indexOf(entry), 1);
  const wasLastSocket = !activeUsers.some((u) => u.userId === entry.userId);
  return { userId: entry.userId, wasLastSocket };
}

export function getActiveSocketIds(userId: string): string[] {
  return activeUsers.filter((u) => u.userId === userId).map((u) => u.socketId);
}

export function isUserOnline(userId: string): boolean {
  return activeUsers.some((u) => u.userId === userId);
}

/** Marks a user online (idempotent — safe to call once per new socket connection). */
export async function markUserOnline(userId: string): Promise<void> {
  await runTransaction((tx) => userService.setOnlineStatus(tx, userId, true));
}

/** Marks a user offline — call only once their last active socket disconnects. */
export async function markUserOffline(userId: string): Promise<void> {
  await runTransaction((tx) => userService.setOnlineStatus(tx, userId, false));
}
