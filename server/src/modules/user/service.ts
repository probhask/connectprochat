import { TxContext } from "../../lib/services/factory/tx-context";
import { paginateQuery } from "../../lib/services/paginate-query/service";
import { ApiError } from "../../lib/api-error";
import Conversation from "../../models/conversation";
import User from "../../models/user";

const PUBLIC_PROFILE_SELECT = "_id username profile_picture isOnline lastSeen";
const PROFILE_PICTURE_POPULATE = {
  path: "profile_picture",
  select: "path _id mimetype originalName fileName fullPath",
};

// ---------------------------------------------------------------------------
// Auth-adjacent
// ---------------------------------------------------------------------------

export async function findUserByEmail(tx: TxContext, email: string) {
  return tx.user.findOne({ email }, { populate: PROFILE_PICTURE_POPULATE });
}

export async function findUserByUsername(tx: TxContext, username: string) {
  return tx.user.findOne({ username }, { populate: PROFILE_PICTURE_POPULATE });
}

/**
 * Login accepts either an email or a username in one field — this is the
 * lookup behind that. Username has no fixed format to sniff, so this
 * always checks both fields in a single query rather than guessing which
 * one `identifier` is; `username` is unique on the model (see
 * models/user.ts) precisely so this can never match more than one account.
 */
export async function findUserByIdentifier(tx: TxContext, identifier: string) {
  // Email is always stored lowercase (see SRegister's yup .lowercase()
  // transform) — lowercase only the email side of the match so a
  // mixed-case email still matches, without forcing username (which IS
  // case-sensitive as stored) to lowercase too.
  return tx.user.findOne(
    { $or: [{ email: identifier.toLowerCase() }, { username: identifier }] },
    { populate: PROFILE_PICTURE_POPULATE }
  );
}

export async function findUserById(tx: TxContext, id: string) {
  return tx.user.findOne({ _id: id }, { populate: PROFILE_PICTURE_POPULATE });
}

export async function createUser(
  tx: TxContext,
  data: { username: string; email: string; hashedPassword: string }
) {
  return tx.user.create({
    username: data.username,
    email: data.email,
    password: data.hashedPassword,
    isVerified: false,
  });
}

export async function setRefreshToken(
  tx: TxContext,
  userId: string,
  refreshToken: string
) {
  return tx.user.updateOne({ _id: userId }, { refreshToken });
}

export async function setOnlineStatus(
  tx: TxContext,
  userId: string,
  isOnline: boolean
) {
  return tx.user.updateOne({ _id: userId }, { isOnline, lastSeen: new Date() });
}

export async function findUserByRefreshToken(tx: TxContext, refreshToken: string) {
  return tx.user.findOne({ refreshToken });
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function updateLastSeen(tx: TxContext, userId: string) {
  return tx.user.updateOne({ _id: userId }, { lastSeen: new Date() });
}

export async function updatePersonalData(
  tx: TxContext,
  userId: string,
  data: { username: string; email: string }
) {
  const updated = await tx.user.updateOne({ _id: userId }, { $set: data });
  if (!updated) throw new ApiError(404, "User not found");
  return updated;
}

export async function updatePassword(
  tx: TxContext,
  userId: string,
  hashedPassword: string
) {
  const updated = await tx.user.updateOne(
    { _id: userId },
    { password: hashedPassword }
  );
  if (!updated) throw new ApiError(404, "User not found");
  return updated;
}

export async function removeProfilePicture(tx: TxContext, userId: string) {
  const updated = await tx.user.updateOne(
    { _id: userId },
    { $set: { profile_picture: null } }
  );
  if (!updated) throw new ApiError(404, "User not found");
  return updated;
}

export async function setProfilePicture(
  tx: TxContext,
  userId: string,
  uploadId: string
) {
  const updated = await tx.user.updateOne(
    { _id: userId },
    { $set: { profile_picture: uploadId } },
    { populate: PROFILE_PICTURE_POPULATE }
  );
  if (!updated) throw new ApiError(404, "User not found");
  return updated;
}

export async function deleteUserAccount(tx: TxContext, userId: string) {
  const deleted = await tx.user.deleteOne({ _id: userId });
  if (!deleted) throw new ApiError(404, "User not found");
  return deleted;
}

/**
 * Mutual friend add — the seam friendRequest/service.ts calls into on
 * accept, so it never has to touch the User model directly.
 */
export async function addFriendPair(
  tx: TxContext,
  userIdA: string,
  userIdB: string
) {
  await tx.user.updateOne({ _id: userIdA }, { $addToSet: { friends: userIdB } });
  await tx.user.updateOne({ _id: userIdB }, { $addToSet: { friends: userIdA } });
}

/** Mutual friend removal, used by the unfriend flow. */
export async function removeFriendPair(
  tx: TxContext,
  userIdA: string,
  userIdB: string
) {
  await tx.user.updateOne({ _id: userIdA }, { $pull: { friends: userIdB } });
  await tx.user.updateOne({ _id: userIdB }, { $pull: { friends: userIdA } });
}

export async function getFriends(tx: TxContext, userId: string) {
  const user = await tx.user.findOne({ _id: userId }, { select: "friends" });
  if (!user) throw new ApiError(404, "User not found");
  return tx.user.findMany(
    { _id: { $in: user.friends } },
    { select: PUBLIC_PROFILE_SELECT, populate: PROFILE_PICTURE_POPULATE }
  );
}

/**
 * Paginated user discovery excluding self, existing friends, and any
 * caller-supplied extra ids (profile.controllers.ts's explore composes in
 * pending-friend-request user ids from the friendRequest module here).
 */
export async function exploreUsers(
  tx: TxContext,
  actingUserId: string,
  options: { page?: number; limit?: number; search?: string; excludeIds?: string[] }
) {
  const actingUser = await tx.user.findOne(
    { _id: actingUserId },
    { select: "friends" }
  );
  if (!actingUser) throw new ApiError(404, "User not found");

  const excludeIds = [
    actingUserId,
    ...actingUser.friends.map((id) => id.toString()),
    ...(options.excludeIds ?? []),
  ];

  return paginateQuery(
    User,
    { _id: { $nin: excludeIds } },
    {
      page: options.page,
      limit: options.limit,
      search: options.search,
      searchFields: ["username"],
    },
    { select: "_id username profile_picture", populate: PROFILE_PICTURE_POPULATE },
    tx.session
  );
}

// ---------------------------------------------------------------------------
// Side profile (user or group)
// ---------------------------------------------------------------------------

export async function getUserProfileView(
  tx: TxContext,
  profileId: string,
  viewerId: string
) {
  const user = await tx.user.findOne(
    { _id: profileId },
    {
      select: "_id username profile_picture isOnline email lastSeen friends",
      populate: [
        PROFILE_PICTURE_POPULATE,
        {
          path: "friends",
          select: "_id username profile_picture",
          populate: PROFILE_PICTURE_POPULATE,
        },
      ],
    }
  );
  if (!user) throw new ApiError(404, "User not found");

  const isFriend = user.friends.some((id) => id.toString() === viewerId);
  return { user, isFriend };
}

export async function getGroupProfileView(profileId: string, viewerId: string) {
  const conversation = await Conversation.findById(profileId).populate({
    path: "participants",
    select: "username _id profile_picture isOnline lastSeen",
    populate: PROFILE_PICTURE_POPULATE,
  });
  if (!conversation) throw new ApiError(404, "Group not found");

  const isMember = (conversation.participants as unknown as { _id: unknown }[]).some(
    (member) => String(member._id) === viewerId
  );
  return { conversation, isMember };
}
