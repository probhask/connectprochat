import { useCallback, useEffect } from "react";
import { useChatAppDispatch } from "@store/hooks";

import { CHAT_LIST } from "types";
import { addInitialChatList } from "@store/slices/chatList";
import useFetchData from "./useFetchData";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

const useChatList = () => {
  const dispatch = useChatAppDispatch();

  // chatList folded into the conversation module (Phase 2) — /chatlist no
  // longer exists, it's GET /conversation/chat-list, and it's self-scoped
  // via the token now (no userId param).
  const [
    chatListResp,
    chatListLoading,
    chatListError,
    fetchChatList,
    abortFetchChatList,
  ] = useFetchData<ApiEnvelope<CHAT_LIST[]>>(
    "/conversation/chat-list",
    "GET",
    {},
    false
  );
  const handleFetchChatList = useCallback(async () => {
    fetchChatList();
  }, [fetchChatList]);

  useEffect(() => {
    if (chatListResp?.data) {
      dispatch(addInitialChatList(chatListResp.data)); //add to redux
    }
  }, [chatListResp, dispatch]);

  useEffect(() => {
    return () => {
      abortFetchChatList();
    };
  }, []);

  return {
    chatListLoading,
    chatListError,
    abortFetchChatList,
    handleFetchChatList,
  };
};

export default useChatList;
