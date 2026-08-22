import mongoose from "mongoose";

import { createTxContext, TxContext } from "./services/factory/tx-context";

/**
 * Direct Mongoose equivalent of lankwai-backend's `runTransaction(async (tx) => ...)`.
 * The callback receives a named, per-model client (`tx.user`, `tx.friendRequest`, ...)
 * instead of a bare session — every module's service functions take `(tx: TxContext, ...)`.
 *
 * @example
 * await runTransaction((tx) => createFriendRequest(tx, senderId, receiverId));
 */
export async function runTransaction<T>(
  fn: (tx: TxContext) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await fn(createTxContext(session));
    });
    return result as T;
  } finally {
    await session.endSession();
  }
}
