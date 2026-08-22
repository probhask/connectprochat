import { Box, List, styled } from "@mui/material";
import { ErrorState, LoadingState } from "@components/FetchingStates";

import ChatListItem from "./ChatListItem";
import EmptyMessage from "@components/EmptyMessage";
import React from "react";
import useChatList from "@hooks/useChatList";

const ChatPreviewList = React.memo(() => {
  // useChatList owns the "only fetch when visible" condition itself now
  // (Phase 5 — see useChatList.tsx) via TanStack Query's `enabled`.
  const { chatList, chatListLoading, chatListError } = useChatList();

  return (
    <ChatListContainer className="hide-scrollbar">
      <List sx={{ pt: 0 }} className="hide-scrollbar">
        {!chatListError &&
          chatList &&
          chatList?.length > 0 &&
          chatList?.map(({ conversation, lastMessage, otherUser }) => {
            // const isGroupChat = conversation.isGroupChat;
            return (
              <ChatListItem
                key={conversation._id}
                conversation={conversation}
                lastMessage={lastMessage}
                otherUser={otherUser}
              />
            );
          })}
      </List>

      {!chatListError && !chatListLoading && chatList.length === 0 && (
        <EmptyMessage
          primaryText="No conversation yet"
          secondaryText="Start chatting with your friends now!"
          buttonText="Start Chat"
          navigateTo="/friends"
        />
      )}
      {chatListLoading && !chatListError && chatList.length === 0 && (
        <LoadingState />
      )}
      {!chatListLoading && chatListError && (
        <ErrorState error={"unable to load data"} />
      )}
    </ChatListContainer>
  );
});

ChatPreviewList.displayName = "ChatPreviewList";

export default ChatPreviewList;

const ChatListContainer = styled(Box)({
  width: "100%",
  height: "calc(100% - 100px)",
  overflow: "auto",
  backgroundColor: "var(--color-light)",
});
