import { CONVERSATION, FRIEND, SUCCESS_RESPONSE } from "types";
import { addInitialFriendData, removeFriend } from "@store/slices/friends";
import { useCallback, useEffect, useState } from "react";
import { useChatAppDispatch } from "@store/hooks";

import toast from "react-hot-toast";
import useChatAppContext from "@context/index";
import useFetchData from "./useFetchData";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

const useFriend = () => {
  const dispatch = useChatAppDispatch();

  const [removeFriendId, setRemoveFriendId] = useState<string | null>(null);
  const [conversationFriendId, setConversationFriendId] = useState<
    string | null
  >(null);
  const { updateConversationRoomId, showConversationTab } = useChatAppContext();

  // Fetch Friends (GET Request) — /user/friend -> /user/friends (plural),
  // self-scoped via the token now, no userId param.
  const [friendResp, friendLoading, friendError, , abortFriends] =
    useFetchData<ApiEnvelope<FRIEND[]>>("/user/friends", "GET", {}, true);

  useEffect(() => {
    if (friendResp?.data) {
      dispatch(addInitialFriendData(friendResp.data)); // add initial friend data to redux
    }
  }, [friendResp, dispatch]);

  // Unfriend Request — friendId only now, actor comes from the token.
  const [
    unfriendResp,
    unfriendLoading,
    unfriendError,
    unfriendUser,
    abortUnfriend,
  ] = useFetchData<SUCCESS_RESPONSE>("/user/unfriend", "DELETE", {}, false);

  const handleUnfriendUser = useCallback(
    async (friendId: string) => {
      if (friendId) {
        setRemoveFriendId(friendId);
        unfriendUser({
          data: { friendId },
        });
      }
    },
    [unfriendUser]
  );
  useEffect(() => {
    if (unfriendResp && unfriendResp.success && removeFriendId) {
      dispatch(removeFriend(removeFriendId)); // remove friend fromm redux
      setRemoveFriendId(null); // clear friendId
      toast.success("Removed successfully");
    }
  }, [unfriendResp, dispatch, removeFriendId]);

  useEffect(() => {
    if (unfriendError && !unfriendLoading) {
      toast.error("Failed to remove");
    }
  }, [unfriendError, unfriendLoading]);

  // Enter conversation room — /conversation/room?userIds=[...] no longer
  // exists; it's GET /conversation/direct/:otherUserId now (self implied
  // from the token, friendship checked server-side).
  const [
    conversationRoomResp,
    conversationRoomLoading,
    conversationRoomError,
    findConversationRoom,
    abortConversationRoom,
  ] = useFetchData<ApiEnvelope<CONVERSATION>>(
    "/conversation/direct/placeholder",
    "GET",
    {},
    false
  );

  const handleFindConversationRoom = useCallback(
    async (friendId: string) => {
      if (friendId) {
        setConversationFriendId(friendId);
        findConversationRoom({
          url: `/conversation/direct/${friendId}`,
        });
      }
    },
    [findConversationRoom]
  );

  useEffect(() => {
    if (
      conversationRoomResp?.data?._id &&
      conversationFriendId
    ) {
      updateConversationRoomId(conversationRoomResp.data._id);
      showConversationTab();
      setConversationFriendId(null);
    }
  }, [
    conversationRoomResp,
    conversationFriendId,
    updateConversationRoomId,
    showConversationTab,
  ]);

  useEffect(() => {
    if (conversationRoomError && !conversationRoomLoading) {
      toast.error("error connecting conversation");
    }
  }, [conversationRoomError, conversationRoomLoading]);

  //   abort all request
  useEffect(() => {
    return () => {
      abortFriends();
      abortUnfriend();
      abortConversationRoom();
    };
  }, []);

  return {
    friendLoading,
    friendError,
    abortFriends,

    unfriendLoading,
    unfriendError,
    removeFriendId,
    handleUnfriendUser,
    abortUnfriend,
    conversationRoomLoading,
    handleFindConversationRoom,
    conversationFriendId,
  };
};

export default useFriend;
