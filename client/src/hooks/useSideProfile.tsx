import { useCallback, useEffect } from "react";

import { SideProfileApiResponse } from "types";
import { addInitialSideProfile } from "@store/slices/sideProfile";
import toast from "react-hot-toast";
import { useChatAppDispatch } from "@store/hooks";
import useFetchData from "./useFetchData";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

const useSideProfile = () => {
  const dispatch = useChatAppDispatch();

  // /profile never existed on the server — folded into the user module as
  // GET /user/side-profile, self-scoped via the token (no userId param).
  const [
    profileResp,
    profileLoading,
    profileError,
    fetchProfileData,
    abortProfileFetch,
  ] = useFetchData<ApiEnvelope<SideProfileApiResponse>>("/user/side-profile", "GET");

  const handleFetchProfileData = useCallback(
    async (userProfileId: string, isGroupProfile: boolean) => {
      if (!userProfileId) return;
      fetchProfileData({
        params: {
          profileId: userProfileId,
          isGroup: isGroupProfile,
        },
      });
    },
    [fetchProfileData]
  );

  useEffect(() => {
    if (profileResp?.data && !profileLoading) {
      dispatch(addInitialSideProfile(profileResp.data));
    }
  }, [profileResp, profileLoading, dispatch]);

  useEffect(() => {
    if (profileError && !profileLoading) {
      toast.error("Failed to load profile");
    }
  }, [profileError, profileLoading]);

  useEffect(() => {
    return () => {
      abortProfileFetch();
    };
  }, []);

  return {
    profileLoading,
    profileError,
    handleFetchProfileData,
    abortProfileFetch,
  };
};

export default useSideProfile;
