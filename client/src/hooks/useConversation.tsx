import type { CONVERSATION, MESSAGE } from "types";
import { useQuery } from "@tanstack/react-query";

import { httpClient } from "@services/apis/httpClient";
import { queryKeys } from "./queryKeys";
import useChatAppContext from "@context/index";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };
type MessagesPage = { results: MESSAGE[]; pagination: { page: number; totalPages: number } };

/**
 * Conversation detail — split from messages (below) as its own query so
 * either can be read independently (e.g. ConversationTopBar only needs
 * this, not the message list) while still sharing one cache entry with
 * whatever else asks for the same conversationId.
 */
export const useConversationDetail = (conversationId: string | null) => {
  return useQuery({
    queryKey: queryKeys.conversation.detail(conversationId ?? ""),
    queryFn: async () => {
      const response = await httpClient.get<ApiEnvelope<CONVERSATION>>(
        `/conversation/${conversationId}`
      );
      return response.data.data;
    },
    enabled: !!conversationId,
  });
};

/**
 * Message history — real-time updates (new message, in either direction)
 * land in this same cache entry via SocketContext.tsx's messageReceived
 * listener, not through a refetch.
 */
export const useConversationMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: queryKeys.conversation.messages(conversationId ?? ""),
    queryFn: async () => {
      const response = await httpClient.get<ApiEnvelope<MessagesPage>>(
        `/conversation/${conversationId}/messages`
      );
      // getMessages sorts createdAt:desc (newest first, for pagination);
      // the message list renders top-to-bottom and auto-scrolls to the
      // last item, so it needs oldest-first.
      return [...response.data.data.results].reverse();
    },
    enabled: !!conversationId,
  });
};

/**
 * Convenience combination of both, scoped to whichever conversation is
 * currently open (per ChatAppContext) — what ConversationPage needs for
 * its loading/error gate. Phase 5: no more Redux conversationRoom slice
 * or an imperative fetchConversation() call — enabled: !!conversationId
 * already IS "fetch when a conversation is opened".
 */
const useConversation = () => {
  const { conversationRoomId } = useChatAppContext();
  const detailQuery = useConversationDetail(conversationRoomId);
  const messagesQuery = useConversationMessages(conversationRoomId);

  return {
    conversation: detailQuery.data,
    messages: messagesQuery.data ?? [],
    conversationLoading: detailQuery.isLoading || messagesQuery.isLoading,
    conversationError: detailQuery.isError || messagesQuery.isError,
  };
};

export default useConversation;
