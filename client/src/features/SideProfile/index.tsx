import { ErrorState, LoadingState } from "@components/FetchingStates";
import React, { useMemo } from "react";
import { Stack, styled } from "@mui/material";

import EmptyMessage from "@components/EmptyMessage";
import RelatedUsers from "./RelatedUsers";
import TopNavigateBtn from "./TopNavigateBtn";
import { USER } from "types";
import UserInfo from "./UserInfo";
import useChatAppContext from "@context/index";
import useSideProfile from "@hooks/useSideProfile";

const SideProfile = React.memo(() => {
  const { userProfileId } = useChatAppContext();
  // useSideProfile owns userProfileId/isGroupProfile/visibility itself now
  // (Phase 5 — see useSideProfile.tsx); `profile` is the single
  // GROUP_PROFILE | USER_PROFILE object straight off the query cache, not
  // the array-of-one the old Redux slice artificially wrapped it in.
  const { profile, profileError, profileLoading } = useSideProfile();

  const profileData: {
    url: string;
    name: string;
    additionalText: string;
    users: USER[];
    profileId: string;
  } = useMemo(() => {
    if (profile) {
      // profile is group
      if ("isMember" in profile) {
        return {
          url: profile.group?.group_picture?.fileName || "",
          name: profile.group.groupName,
          additionalText: `${profile.group.participants?.length || 0} members`,
          users: profile.group.participants ?? [],
          profileId: profile.group._id,
        };
      }
      return {
        url: profile.user?.profile_picture?.fileName || "",
        name: profile.user.username,
        additionalText: profile.user.email,
        users: profile.user?.friends ?? [],
        profileId: profile.user._id,
      };
    }
    return {
      url: "",
      name: "Unknown",
      additionalText: "",
      users: [],
      profileId: "",
    };
  }, [profile]);

  const isGroup = profile?.type === "GROUP_PROFILE";

  return (
    <ProfileInfoContainer>
      {profile && (
        <>
          <TopNavigateBtn />
          <UserInfo
            url={profileData?.url}
            name={profileData?.name}
            additionalText={profileData?.additionalText}
          />
          {/* <MediaList /> */}
          {/* <div style={{ flex: 1 }} /> */}
          {profileData?.users && (
            <RelatedUsers users={profileData.users} isGroup={isGroup} />
          )}
        </>
      )}
      {!profileLoading && !profile && (
        <EmptyMessage primaryText="Select a profile" />
      )}
      {profileLoading && !profile && <LoadingState />}
      {!profileLoading && profileError && userProfileId && (
        <ErrorState error={"unable to load data"} />
      )}
    </ProfileInfoContainer>
  );
});
SideProfile.displayName = "SideProfile";

export default SideProfile;

const ProfileInfoContainer = styled(Stack)({
  width: "100%",
  height: "100vh",
  overflow: "hidden",
  overflowY: "auto",
  backgroundColor: "var(--color-light)",
  position: "relative",
});
