import { useQuery } from "@tanstack/react-query";

import { CHAT_LIST } from "types";
import { httpClient } from "@services/apis/httpClient";
import { queryKeys } from "./queryKeys";
import useChatAppContext from "@context/index";
import { useLocation } from "react-router-dom";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

/**
 * Phase 5 — chat list is server cache, migrated onto TanStack Query.
 * `enabled` replicates the same "only fetch when this list is actually
 * visible" condition ChatPreviewList used to compute and pass into a
 * manual fetchChatList() call — moved in here so the hook is
 * self-sufficient (matches useExplore/useFriend), and because the
 * moment it becomes visible is exactly when a query should (re)run
 * anyway, which `enabled` already does natively.
 */
const useChatList = () => {
  const location = useLocation();
  const { conversationTab, profileTab } = useChatAppContext();

  const isVisible =
    (location.pathname === "/" && !conversationTab && !profileTab) ||
    !!((conversationTab || profileTab) && window.innerWidth > 600);

  const {
    data: chatList = [],
    isLoading: chatListLoading,
    isError: chatListError,
  } = useQuery({
    queryKey: queryKeys.conversation.chatList(),
    queryFn: async () => {
      const response = await httpClient.get<ApiEnvelope<CHAT_LIST[]>>(
        "/conversation/chat-list"
      );
      return response.data.data;
    },
    enabled: isVisible,
  });

  return {
    chatList,
    chatListLoading,
    chatListError,
  };
};

export default useChatList;
