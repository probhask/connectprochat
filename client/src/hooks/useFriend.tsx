import { CONVERSATION, FRIEND } from "types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { httpClient } from "@services/apis/httpClient";
import { queryKeys } from "./queryKeys";
import toast from "react-hot-toast";
import useChatAppContext from "@context/index";
import { useState } from "react";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

/**
 * Phase 5 — friends list is server cache, migrated onto TanStack Query.
 * useFriendRequest's accept mutation writes into this same
 * queryKeys.user.friends() cache entry (rather than a Redux
 * addFriend action) so the two features stay in sync without a shared
 * Redux slice — see useFriendRequest.tsx.
 */
const useFriend = () => {
  const queryClient = useQueryClient();
  const [removeFriendId, setRemoveFriendId] = useState<string | null>(null);
  const [conversationFriendId, setConversationFriendId] = useState<
    string | null
  >(null);
  const { updateConversationRoomId, showConversationTab } = useChatAppContext();

  const {
    data: friends = [],
    isLoading: friendLoading,
    isError: friendError,
  } = useQuery({
    queryKey: queryKeys.user.friends(),
    queryFn: async () => {
      const response = await httpClient.get<ApiEnvelope<FRIEND[]>>(
        "/user/friends"
      );
      return response.data.data;
    },
  });

  const unfriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await httpClient.delete("/user/unfriend", { data: { friendId } });
      return friendId;
    },
    onMutate: (friendId: string) => setRemoveFriendId(friendId),
    onSuccess: (friendId) => {
      queryClient.setQueryData<FRIEND[] | undefined>(
        queryKeys.user.friends(),
        (old) => old?.filter((f) => f._id !== friendId)
      );
      toast.success("Removed successfully");
    },
    onError: () => toast.error("Failed to remove"),
    onSettled: () => setRemoveFriendId(null),
  });

  const conversationRoomMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const response = await httpClient.get<ApiEnvelope<CONVERSATION>>(
        `/conversation/direct/${friendId}`
      );
      return response.data.data;
    },
    onMutate: (friendId: string) => setConversationFriendId(friendId),
    onSuccess: (conversation) => {
      if (!conversation?._id) return;
      updateConversationRoomId(conversation._id);
      showConversationTab();
    },
    onError: () => toast.error("error connecting conversation"),
    onSettled: () => setConversationFriendId(null),
  });

  return {
    friends,
    friendLoading,
    friendError,

    unfriendLoading: unfriendMutation.isPending,
    unfriendError: unfriendMutation.isError,
    removeFriendId,
    handleUnfriendUser: unfriendMutation.mutate,

    conversationRoomLoading: conversationRoomMutation.isPending,
    handleFindConversationRoom: conversationRoomMutation.mutate,
    conversationFriendId,
  };
};

export default useFriend;
