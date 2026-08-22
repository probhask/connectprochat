import { Box, List, styled } from "@mui/material";
import { ErrorState, LoadingState } from "@components/FetchingStates";
import React, { useEffect } from "react";

import ChatListItem from "./ChatListItem";
import EmptyMessage from "@components/EmptyMessage";
import useChatAppContext from "@context/index";
import { useChatAppSelector } from "@store/hooks";
import useChatList from "@hooks/useChatList";
import { useLocation } from "react-router-dom";

const ChatPreviewList = React.memo(() => {
  const chatList = useChatAppSelector((store) => store.chatList);
  const {
    chatListLoading,
    chatListError,
    abortFetchChatList,
    handleFetchChatList,
  } = useChatList();
  const location = useLocation();
  const { conversationTab, profileTab } = useChatAppContext();

  useEffect(() => {
    if (
      (location.pathname === "/" && !conversationTab && !profileTab) ||
      ((conversationTab || profileTab) && window.innerWidth > 600)
    ) {
      handleFetchChatList();
    }
    return () => {
      abortFetchChatList();
    };
  }, [conversationTab, profileTab, location.pathname]);

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
