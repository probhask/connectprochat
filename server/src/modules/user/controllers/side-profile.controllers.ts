import { asyncWrapper } from "../../../lib/async-wrapper";
import { successResponse } from "../../../lib/response-handlers";
import { runTransaction } from "../../../lib/transaction";
import { SSideProfileQuery } from "../schemas";
import * as userService from "../service";

/**
 * Returns the side-panel profile view for either a user or a group
 * (conversation), including whether the viewer is a friend/member.
 * @route GET /api/user/side-profile
 * @query SSideProfileQuery — { profileId, isGroup }
 * @auth required — verifyJWT (viewer comes from req.userId, never a query param)
 */
export const getSideProfileData = asyncWrapper(
  async (req, res, { query }) => {
    const viewerId = req.userId!;

    if (query.isGroup === "false") {
      const { user, isFriend } = await runTransaction((tx) =>
        userService.getUserProfileView(tx, query.profileId, viewerId)
      );
      return successResponse(res, { data: { user, isFriend, type: "USER_PROFILE" } });
    }

    const { conversation, isMember } = await userService.getGroupProfileView(
      query.profileId,
      viewerId
    );
    return successResponse(res, {
      data: { group: conversation, isMember, type: "GROUP_PROFILE" },
    });
  },
  { query: SSideProfileQuery }
);
