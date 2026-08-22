import { useQuery } from "@tanstack/react-query";

import { SideProfileApiResponse } from "types";
import { httpClient } from "@services/apis/httpClient";
import { queryKeys } from "./queryKeys";
import { useLocation } from "react-router-dom";
import useChatAppContext from "@context/index";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

/**
 * Phase 5 — side profile is server cache, migrated onto TanStack Query.
 * Self-sufficient like useChatList: pulls userProfileId/isGroupProfile
 * straight from context instead of the consumer computing them and
 * calling a fetch trigger — `enabled` already IS "should this fetch run
 * right now", so there's no separate imperative trigger to wire up.
 */
const useSideProfile = () => {
  const location = useLocation();
  const { userProfileId, isGroupProfile, profileTab } = useChatAppContext();

  const isVisible =
    !!userProfileId &&
    ((location.pathname === "/" && profileTab) || window.innerWidth > 600);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: queryKeys.user.sideProfile(userProfileId ?? "", isGroupProfile),
    queryFn: async () => {
      const response = await httpClient.get<ApiEnvelope<SideProfileApiResponse>>(
        "/user/side-profile",
        { params: { profileId: userProfileId, isGroup: isGroupProfile } }
      );
      return response.data.data;
    },
    enabled: isVisible,
  });

  return {
    profile,
    profileLoading,
    profileError,
  };
};

export default useSideProfile;
