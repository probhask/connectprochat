import { asyncWrapper } from "../../../lib/async-wrapper";
import { ApiError } from "../../../lib/api-error";
import { successResponse } from "../../../lib/response-handlers";
import { runTransaction } from "../../../lib/transaction";
import { hashPassword, sanitizePublicUserProfile, verifyPassword } from "../helpers";
import {
  SExploreQuery,
  SGetUserParams,
  SRemoveFriend,
  SUpdatePassword,
  SUpdatePersonalData,
} from "../schemas";
import * as userService from "../service";

/**
 * Fetches another user's PUBLIC profile by id — deliberately narrow (no
 * email, no friends list; see sanitizePublicUserProfile) since the viewer
 * may have no relationship to this user at all. Viewing your own full
 * profile should go through a self-scoped endpoint instead, not this one.
 * @route GET /api/user/:id
 * @params SGetUserParams — { id }
 * @auth required — verifyJWT
 */
export const getUser = asyncWrapper(
  async (req, res, { params }) => {
    const user = await runTransaction((tx) => userService.findUserById(tx, params.id));
    if (!user) throw new ApiError(404, "User not found");
    return successResponse(res, { data: sanitizePublicUserProfile(user) });
  },
  { params: SGetUserParams }
);

/**
 * Paginated user discovery, excluding the caller and their existing friends.
 * @route GET /api/user/explore
 * @query SExploreQuery — { page?, limit?, search? }
 * @auth required — verifyJWT
 */
export const explore = asyncWrapper(
  async (req, res, { query }) => {
    const userId = req.userId!;
    const result = await runTransaction((tx) =>
      userService.exploreUsers(tx, userId, query)
    );
    return successResponse(res, { data: result });
  },
  { query: SExploreQuery }
);

/**
 * Returns the caller's own friends list.
 * @route GET /api/user/friends
 * @auth required — verifyJWT
 */
export const getFriends = asyncWrapper(async (req, res) => {
  const userId = req.userId!;
  const { data } = await runTransaction((tx) => userService.getFriends(tx, userId));
  return successResponse(res, { data });
});

/**
 * Removes a mutual friendship between the caller and `friendId`.
 *
 * Note: the pre-revamp version of this endpoint also deleted the 1:1
 * conversation + messages + media between the pair. That cross-module
 * cleanup is intentionally deferred until the `conversation`/`upload`
 * modules land later in Phase 2 — this controller composes it in then,
 * rather than reaching into models this module doesn't own.
 * @route DELETE /api/user/unfriend
 * @body SRemoveFriend — { friendId }
 * @auth required — verifyJWT
 */
export const removeFriend = asyncWrapper(
  async (req, res, { body }) => {
    const userId = req.userId!;
    await runTransaction((tx) => userService.removeFriendPair(tx, userId, body.friendId));
    return successResponse(res, { message: "Friend removed successfully" });
  },
  { body: SRemoveFriend }
);

/**
 * Updates the caller's own username/email.
 * @route PUT /api/user/update-profile-data
 * @body SUpdatePersonalData — { username, email }
 * @auth required — verifyJWT
 */
export const updatePersonalData = asyncWrapper(
  async (req, res, { body }) => {
    const userId = req.userId!;
    const updated = await runTransaction((tx) =>
      userService.updatePersonalData(tx, userId, body)
    );
    return successResponse(res, {
      data: { username: updated.username, email: updated.email },
    });
  },
  { body: SUpdatePersonalData }
);

/**
 * Updates the caller's own password (requires the current password).
 * @route PUT /api/user/update-password
 * @body SUpdatePassword — { password, newPassword }
 * @auth required — verifyJWT
 */
export const updatePassword = asyncWrapper(
  async (req, res, { body }) => {
    const userId = req.userId!;
    const user = await runTransaction((tx) => userService.findUserById(tx, userId));
    if (!user) throw new ApiError(404, "User not found");

    const isMatch = await verifyPassword(body.password, user.password);
    if (!isMatch) throw new ApiError(400, "Invalid password");

    const hashedPassword = await hashPassword(body.newPassword);
    await runTransaction((tx) => userService.updatePassword(tx, userId, hashedPassword));
    return successResponse(res, { message: "Password updated successfully" });
  },
  { body: SUpdatePassword }
);

/**
 * Removes the caller's own profile picture.
 * @route DELETE /api/user/profile-pic
 * @auth required — verifyJWT
 */
export const removeProfilePicture = asyncWrapper(async (req, res) => {
  const userId = req.userId!;
  await runTransaction((tx) => userService.removeProfilePicture(tx, userId));
  return successResponse(res, { message: "Profile picture removed successfully" });
});

/**
 * Bumps the caller's lastSeen timestamp.
 * @route PATCH /api/user/last-seen
 * @auth required — verifyJWT
 */
export const updateLastSeen = asyncWrapper(async (req, res) => {
  const userId = req.userId!;
  await runTransaction((tx) => userService.updateLastSeen(tx, userId));
  return res.sendStatus(200);
});

/**
 * Deletes the caller's own account. No target-id parameter — this is the
 * fix for the audit's account-deletion IDOR (previously `DELETE
 * /api/user?id=<anyUserId>` let any authenticated user delete anyone).
 * @route DELETE /api/user
 * @auth required — verifyJWT
 */
export const deleteAccount = asyncWrapper(async (req, res) => {
  const userId = req.userId!;
  await runTransaction((tx) => userService.deleteUserAccount(tx, userId));
  return successResponse(res, { message: "Account deleted successfully" });
});
