import mongoose, { Types } from "mongoose";

import { TxContext } from "../../lib/services/factory/tx-context";
import { ApiError } from "../../lib/api-error";
import { paginateQuery } from "../../lib/services/paginate-query/service";
import Conversation, { IConversation } from "../../models/conversation";
import Message, { IMessage } from "../../models/message";
import { deleteMedia } from "../../utils/deleteMedia";

const PARTICIPANT_SELECT = "username _id profile_picture isOnline lastSeen";
const PROFILE_PICTURE_POPULATE = {
  path: "profile_picture",
  model: "Upload",
  select: "path _id mimetype originalName fileName fullPath",
};
const SENDER_POPULATE = {
  path: "sender",
  select: "username _id profile_picture",
  populate: PROFILE_PICTURE_POPULATE,
};
const MEDIA_POPULATE = {
  path: "media",
  select: "path _id mimetype originalName fileName fullPath",
};

/** Deletes one message's attached media (disk file + Upload doc), if any. */
async function deleteMessageMedia(tx: TxContext, message: IMessage): Promise<void> {
  if (!message.media) return;
  const dbMedia = await tx.upload.findOne({ _id: message.media });
  if (dbMedia) deleteMedia(dbMedia);
  await tx.upload.deleteOne({ _id: message.media });
}

/**
 * Throws unless `userId` is a participant of `conversationId`. The one
 * membership check every conversation/message operation in this module
 * funnels through — also reused by the socket layer in Phase 3 (see the
 * revamp plan's sockets/helpers.ts design) so join/emit authorization uses
 * the exact same rule as the REST endpoints.
 */
export async function assertIsParticipant(
  tx: TxContext,
  conversationId: string,
  userId: string
): Promise<IConversation> {
  const conversation = await tx.conversation.findOne({ _id: conversationId });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const isParticipant = conversation.participants.some(
    (id) => id.toString() === userId
  );
  if (!isParticipant) {
    throw new ApiError(403, "You are not a participant of this conversation");
  }
  return conversation;
}

/**
 * Fetches a conversation by id, scoped to a viewer who must be a
 * participant — the pre-revamp version had no membership check at all, so
 * any authenticated user could read any conversation (including its full
 * participant list) just by knowing/guessing the id.
 */

/**
 * Just the ids of every conversation this user is a participant in — used
 * to join their socket to all of those rooms at connect time (see
 * sockets/handlers/connection.ts), not to render anything. Without this, a
 * socket only ever joins a conversation's room when that specific
 * conversation is opened, so the chat list's live last-message preview
 * (and any future "new message" indicator) only ever updated for whichever
 * one conversation happened to be open — everything else needed a reload.
 */
export async function getUserConversationIds(
  tx: TxContext,
  userId: string
): Promise<string[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const { data } = await tx.conversation.findMany({
    participants: { $in: [userObjectId] },
  });
  return data.map((c) => c._id.toString());
}

export async function getConversationById(
  tx: TxContext,
  conversationId: string,
  viewerId: string
) {
  const conversation = await tx.conversation.findOne(
    { _id: conversationId },
    { populate: [{ path: "participants", select: PARTICIPANT_SELECT, populate: PROFILE_PICTURE_POPULATE }] }
  );
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const isParticipant = (
    conversation.participants as unknown as { _id: Types.ObjectId }[]
  ).some((p) => p._id.toString() === viewerId);
  if (!isParticipant) {
    throw new ApiError(403, "You are not a participant of this conversation");
  }

  if (conversation.isGroupChat) return conversation;

  // 1:1 chat — shape the response around "the other participant" for display,
  // matching the pre-revamp response shape (in-memory only, never persisted).
  const otherParticipant = (
    conversation.participants as unknown as { _id: Types.ObjectId }[]
  ).find((p) => p._id.toString() !== viewerId);
  return { ...conversation.toObject(), participants: otherParticipant };
}

/**
 * Finds (or creates) the 1:1 conversation between the caller and
 * `otherUserId`. Requires the two to already be friends — replaces the
 * pre-revamp getConversationRoom, which took two arbitrary user ids with no
 * requirement that the caller be either of them (letting anyone create/
 * fetch a conversation "room" between two other people).
 */
export async function getOrCreateDirectConversation(
  tx: TxContext,
  userId: string,
  otherUserId: string
) {
  if (userId === otherUserId) {
    throw new ApiError(400, "Can't start a conversation with yourself");
  }

  const user = await tx.user.findOne({ _id: userId }, { select: "friends" });
  if (!user || !user.friends.some((id) => id.toString() === otherUserId)) {
    throw new ApiError(403, "You can only message users you're friends with");
  }

  const participantObjectIds = [userId, otherUserId].map(
    (id) => new mongoose.Types.ObjectId(id)
  );
  const existing = await tx.conversation.findOne({
    participants: { $all: participantObjectIds, $size: 2 },
    isGroupChat: false,
  });
  if (existing) return existing;

  return tx.conversation.create({
    participants: participantObjectIds,
    isGroupChat: false,
  } as unknown as Partial<IConversation>);
}

/**
 * Creates a conversation (group or, less commonly through this endpoint,
 * direct). The creator is always included in participants — the pre-revamp
 * version accepted an arbitrary participant list with no requirement the
 * caller be part of it at all.
 */
export async function createConversation(
  tx: TxContext,
  creatorId: string,
  participantIds: string[],
  isGroupChat: boolean,
  groupName?: string
) {
  const uniqueParticipantIds = Array.from(new Set([...participantIds, creatorId]));

  if (!isGroupChat) {
    // Same "must already be friends" rule getOrCreateDirectConversation
    // enforces — without this, that rule was bypassable by creating the
    // identical kind of 1:1 conversation through this endpoint instead.
    const otherId = uniqueParticipantIds.find((id) => id !== creatorId);
    const creator = await tx.user.findOne({ _id: creatorId }, { select: "friends" });
    if (!creator || !otherId || !creator.friends.some((id) => id.toString() === otherId)) {
      throw new ApiError(403, "You can only message users you're friends with");
    }
  }

  if (isGroupChat) {
    const existingGroup = await tx.conversation.findOne({
      groupName,
      isGroupChat: true,
    });
    if (existingGroup) {
      throw new ApiError(409, "A group chat with the same name already exists");
    }
    return tx.conversation.create({
      participants: uniqueParticipantIds,
      isGroupChat: true,
      groupName,
    } as unknown as Partial<IConversation>);
  }

  const existing = await tx.conversation.findOne({
    participants: { $all: uniqueParticipantIds, $size: uniqueParticipantIds.length },
    isGroupChat: false,
  });
  if (existing) {
    throw new ApiError(409, "Conversation with these participants already exists");
  }
  return tx.conversation.create({
    participants: uniqueParticipantIds,
    isGroupChat: false,
  } as unknown as Partial<IConversation>);
}

/**
 * Deletes a conversation and its messages. Requires the caller to be a
 * participant — the pre-revamp version had no such check, so any
 * authenticated user could delete any conversation by id.
 */
export async function deleteConversation(
  tx: TxContext,
  conversationId: string,
  userId: string
) {
  await assertIsParticipant(tx, conversationId, userId);

  // Clean up media before the messages that reference it — the pre-revamp
  // version's TODO ("delete media in message") was never implemented, so
  // every deleted conversation used to leak its attached files on disk.
  const { data: messagesWithMedia } = await tx.message.findMany({
    conversationId,
    media: { $ne: null },
  });
  await Promise.all(messagesWithMedia.map((message) => deleteMessageMedia(tx, message)));

  // tx.message.deleteOne only removes a single match (Mongoose
  // findOneAndDelete semantics) — bulk deletion needs the real deleteMany.
  await Message.deleteMany({ conversationId }).session(tx.session);
  await tx.conversation.deleteOne({ _id: conversationId });
}

export async function addParticipants(
  tx: TxContext,
  conversationId: string,
  userId: string,
  participantIds: string[]
) {
  const conversation = await assertIsParticipant(tx, conversationId, userId);
  if (!conversation.isGroupChat) {
    throw new ApiError(400, "Cannot add participants to a one-on-one conversation");
  }

  const validUsers = await tx.user.findMany({ _id: { $in: participantIds } });
  if (validUsers.data.length !== participantIds.length) {
    throw new ApiError(400, "One or more participant IDs are invalid");
  }

  const existingIds = new Set(conversation.participants.map((id) => id.toString()));
  const newParticipantIds = participantIds.filter((id) => !existingIds.has(id));
  if (newParticipantIds.length === 0) {
    throw new ApiError(400, "All provided participants are already in the conversation");
  }

  return tx.conversation.updateOne(
    { _id: conversationId },
    { $addToSet: { participants: { $each: newParticipantIds } } }
  );
}

export async function removeParticipants(
  tx: TxContext,
  conversationId: string,
  userId: string,
  participantIds: string[]
) {
  const conversation = await assertIsParticipant(tx, conversationId, userId);
  if (!conversation.isGroupChat) {
    throw new ApiError(400, "Cannot remove participants from a one-on-one conversation");
  }

  return tx.conversation.updateOne(
    { _id: conversationId },
    { $pull: { participants: { $in: participantIds } } }
  );
}

/**
 * Aggregation-based chat list (last message + "other user" preview per
 * conversation), always scoped to the caller — the pre-revamp version took
 * an arbitrary `userId` query param, letting any authenticated user view
 * anyone else's chat list.
 */
export async function getChatList(tx: TxContext, userId: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  return Conversation.aggregate([
    { $match: { participants: { $in: [userObjectId] } } },
    {
      $lookup: {
        from: "messages",
        let: { conversationId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$conversationId", "$$conversationId"] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "lastMessage",
      },
    },
    { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        let: { participants: "$participants" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", "$$participants"] },
                  { $ne: ["$_id", userObjectId] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "otherUser",
      },
    },
    { $unwind: { path: "$otherUser", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "uploads",
        localField: "otherUser.profile_picture",
        foreignField: "_id",
        as: "otherUser.profile_picture_details",
      },
    },
    { $unwind: { path: "$otherUser.profile_picture_details", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        conversation: {
          _id: "$_id",
          participants: "$participants",
          isGroupChat: "$isGroupChat",
          groupName: { $ifNull: ["$groupName", "Unknown"] },
        },
        lastMessage: {
          text: { $ifNull: ["$lastMessage.text", "No Message yet"] },
          sender: { $ifNull: ["$lastMessage.sender", ""] },
          media: { $ifNull: ["$lastMessage.media", ""] },
          createdAt: "$lastMessage.createdAt",
        },
        otherUser: {
          _id: { $ifNull: ["$otherUser._id", ""] },
          username: { $ifNull: ["$otherUser.username", "Unknown"] },
          isOnline: { $ifNull: ["$otherUser.isOnline", false] },
          lastSeen: { $ifNull: ["$otherUser.lastSeen", undefined] },
          profile_picture: {
            originalName: { $ifNull: ["$otherUser.profile_picture_details.originalName", ""] },
            fileName: { $ifNull: ["$otherUser.profile_picture_details.fileName", ""] },
            path: { $ifNull: ["$otherUser.profile_picture_details.path", ""] },
            fullPath: { $ifNull: ["$otherUser.profile_picture_details.fullPath", ""] },
            mimeType: { $ifNull: ["$otherUser.profile_picture_details.mimeType", ""] },
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]).session(tx.session);
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

/**
 * Paginated message history for a conversation. Requires the caller to be a
 * participant — the pre-revamp version had no such check (any authenticated
 * user could read any conversation's messages by id) and no pagination at
 * all (loaded the entire history in one query).
 */
export async function getMessages(
  tx: TxContext,
  conversationId: string,
  userId: string,
  options: { page?: number; limit?: number }
) {
  await assertIsParticipant(tx, conversationId, userId);
  return paginateQuery(
    Message,
    { conversationId },
    { page: options.page, limit: options.limit, sort: "createdAt:desc" },
    { populate: [MEDIA_POPULATE, SENDER_POPULATE] },
    tx.session
  );
}

/**
 * Sends a message. Sender is always the caller (req.userId) — the pre-revamp
 * version took `senderId` from the request body, letting any authenticated
 * user send a message that appeared to come from someone else. Requires the
 * caller to already be a participant.
 */
export async function sendMessage(
  tx: TxContext,
  conversationId: string,
  senderId: string,
  text: string
) {
  await assertIsParticipant(tx, conversationId, senderId);

  const message = await tx.message.create({
    conversationId,
    sender: senderId,
    text,
  } as unknown as Partial<IMessage>);

  return tx.message.findOne(
    { _id: message._id },
    { populate: [SENDER_POPULATE, MEDIA_POPULATE] }
  );
}

/**
 * Deletes the caller's own messages (and any attached media). Ownership is
 * enforced by filtering on `sender: userId` — the pre-revamp version took an
 * arbitrary `userId` in the body, letting an attacker delete another user's
 * messages by supplying that user's id.
 */
export async function deleteMessages(
  tx: TxContext,
  messageIds: string[],
  userId: string
) {
  const { data: messagesToDelete } = await tx.message.findMany({
    _id: { $in: messageIds },
    sender: userId,
  });
  if (messagesToDelete.length === 0) {
    throw new ApiError(404, "No messages found that you sent");
  }

  await Promise.all(messagesToDelete.map((message) => deleteMessageMedia(tx, message)));

  const deletedIds = messagesToDelete.map((m) => m._id);
  await Message.deleteMany({ _id: { $in: deletedIds } }).session(tx.session);
  return deletedIds.length;
}

/**
 * Marks messages as received/read for the caller. `userId` is always
 * req.userId — the pre-revamp version took it from the request body,
 * letting any authenticated user mark messages as read/received on behalf
 * of someone else. Requires the caller to be a conversation participant.
 */
export async function updateMessageStatus(
  tx: TxContext,
  conversationId: string,
  messageIds: string[],
  userId: string,
  isReceived: boolean,
  isRead: boolean
) {
  await assertIsParticipant(tx, conversationId, userId);

  const { data: rawMessages } = await tx.message.findMany({
    _id: { $in: messageIds },
    conversationId,
  });
  // A sender can't have a "received/read by me" status on their own
  // message — only the other participant(s) can. Dropping this filter
  // would let a status entry get pushed for the sender against themselves.
  const messages = rawMessages.filter((m) => m.sender.toString() !== userId);

  await Promise.all(
    messages.map((message) => {
      const existingStatus = message.status.find((s) => s.user.toString() === userId);
      if (existingStatus) {
        existingStatus.isReceived = isReceived;
        existingStatus.isRead = isRead;
      } else {
        message.status.push({ user: new mongoose.Types.ObjectId(userId), isReceived, isRead });
      }
      return message.save({ session: tx.session });
    })
  );

  return messages.length;
}
