import { Box, styled } from "@mui/material";
import React, { useEffect, useRef } from "react";

import MessageAvatar from "./MessageAvatar";
import { useChatAppSelector } from "@store/hooks";
import useChatAppContext from "@context/index";
import { useConversationMessages } from "@hooks/useConversation";
import useMessageContext from "@context/messageContext";

const MessageItem = React.lazy(() => import("./MessageItem"));

const MessageListContainer = styled(Box)({
  flex: 1,
  width: "100%",
  overflowY: "auto",
  paddingInline: 8,
  paddingBlock: 12,
  display: "flex",
  flexDirection: "column",
  rowGap: 20,
  scrollBehavior: "smooth",
});

const MessagesList = React.memo(() => {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { conversationRoomId } = useChatAppContext();
  // Same queryKey as useConversation's — shares the already-fetched cache
  // entry, no extra request (Phase 5).
  const { data: messages = [] } = useConversationMessages(conversationRoomId);
  const currentUserId = useChatAppSelector((store) => store.auth._id);
  const {
    selectedMessageIds,
    addSelectedMessage,
    removeSelectedMessage,
    clearAllSelectedMessage,
  } = useMessageContext();

  useEffect(() => {
    messageEndRef?.current?.scrollIntoView({ behavior: "smooth" });
    return () => {
      clearAllSelectedMessage();
    };
  }, [messages]);

  return (
    <Box
      sx={{
        flex: 1,
        width: "100%",
        overflowY: "auto",
        background: "url('chatAppBg.png')",
        // scrollBehavior: "smooth",
      }}
      className="hide-scrollbar"
    >
      <MessageListContainer className="hide-scrollbar">
        {messages.map((msg) => {
          const { _id, sender } = msg;
          const isOwn = sender._id === currentUserId;
          return (
            <Box
              key={_id}
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                zIndex: 1,
              }}
            >
              {selectedMessageIds?.includes(_id) && (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 20,
                    backgroundColor: "rgba(67, 56, 120,0.5)",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    removeSelectedMessage(_id);
                  }}
                />
              )}
              <Box
                sx={{
                  maxWidth: "80%",
                  alignSelf: `${isOwn ? "end" : "start"}`,
                  display: "flex",
                  // flexDirection: "column",
                  columnGap: 1,
                }}
                className="msg-elm"
                onDoubleClick={() => {
                  if (isOwn) {
                    addSelectedMessage(_id);
                  }
                }}
                onClick={() => {
                  if (isOwn && selectedMessageIds.length > 0) {
                    addSelectedMessage(_id);
                  }
                }}
              >
                <MessageItem message={msg} isOwn={isOwn} />
                <MessageAvatar
                  isOwn={isOwn}
                  imageSrc={sender.profile_picture?.fileName || ""}
                  username={sender?.username}
                />
              </Box>
            </Box>
          );
        })}
      </MessageListContainer>
      <div ref={messageEndRef} />
    </Box>
  );
});
MessagesList.displayName = "MessagesList";

export default MessagesList;
