import type { CONVERSATION, MESSAGE } from "types";
import { useChatAppDispatch, useChatAppSelector } from "@store/hooks";

import { addInitialConversationRoomData } from "@store/slices/conversation";
import axiosError from "@utils/AxiosError/axiosError";
import { useCallback } from "react";
import useRefresh from "./useRefresh";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };
type MessagesPage = { results: MESSAGE[]; pagination: { page: number; totalPages: number } };

const useConversation = () => {
  const dispatch = useChatAppDispatch();
  const userId = useChatAppSelector((store) => store.auth._id);
  const api = useRefresh();
  const fetchConversation = useCallback(
    async (conversationRoomId: string) => {
      try {
        if (!conversationRoomId || !userId) {
          return;
        }

        // Folded into the conversation module (Phase 2) — /conversation and
        // /message no longer exist; it's GET /conversation/:id and GET
        // /conversation/:id/messages now, both scoped by the token, and
        // both wrapped in the { success, message, data } envelope.
        const conversationApi = api.get<ApiEnvelope<CONVERSATION>>(
          `/conversation/${conversationRoomId}`
        );
        const messageApi = api.get<ApiEnvelope<MessagesPage>>(
          `/conversation/${conversationRoomId}/messages`
        );

        const [conversation, messages] = await Promise.all([
          conversationApi,
          messageApi,
        ]);
        dispatch(
          addInitialConversationRoomData({
            conversation: conversation.data.data,
            // getMessages sorts createdAt:desc (newest first, for
            // pagination); the message list renders top-to-bottom and
            // auto-scrolls to the last item, so it needs oldest-first.
            messages: [...messages.data.data.results].reverse(),
          })
        );
      } catch (error) {
        axiosError(error);
      }
    },
    [dispatch, userId]
  );

  return { fetchConversation };
};

export default useConversation;
