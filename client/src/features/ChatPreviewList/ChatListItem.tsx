import type { CONVERSATION, MEDIA_TYPE } from "types";
import {
  Grid2,
  ListItemAvatar,
  ListItemButton,
  Typography,
  styled,
} from "@mui/material";
import React, { useCallback, useMemo } from "react";

import ChatListItemText from "./ChatListItemText";
import ProfileAvatar from "@components/ProfileAvatar";
import { convertDate } from "@utils/convertDate";
import useChatAppContext from "@context/index";
import { useChatAppSelector } from "@store/hooks";

type ItemProps = {
  conversation: CONVERSATION;
  lastMessage: {
    text: string;
    sender: string;
    media: string;
  };
  otherUser: {
    _id: string;
    username: string;
    isOnline: false;
    profile_picture: MEDIA_TYPE | null;
    lastSeen: Date | undefined;
  };
  //   chooseConversation: (conversationId: string) => void;
};

const ChatListItem = React.memo(
  ({
    conversation: {
      _id: conversationId,
      groupName,
      isGroupChat,
      group_picture,
    },
    lastMessage: { text, sender, media },
    otherUser: {
      isOnline,
      lastSeen,
      profile_picture,
      username,
      _id: otherUserId,
    },
  }: ItemProps) => {
    const userId = useChatAppSelector((store) => store.auth._id);
    const {
      conversationRoomId,
      showProfileTab,
      updateUserProfileId,
      updateConversationRoomId,
      showConversationTab,
    } = useChatAppContext();

    const primaryText: string = useMemo(() => {
      return isGroupChat ? groupName : username;
    }, [isGroupChat, groupName, username]);

    const secondaryText: string = useMemo(() => {
      return ` ${sender === userId ? "You : " : `${username} : `}
      ${text}
      ${!text ? media && "FILE" : ""}`;
    }, [username, media, sender, text, userId]);

    const timeText: string | false | undefined = useMemo(() => {
      return !isGroupChat && !isOnline && lastSeen && convertDate(lastSeen);
    }, [isGroupChat, isOnline, lastSeen]);

    const chooseConversation = useCallback(
      (conversationId: string) => {
        if (!conversationId) return;
        updateConversationRoomId(conversationId);
        showConversationTab();
      },
      [showConversationTab, updateConversationRoomId]
    );

    return (
      <ListItemButton
        onClick={() => chooseConversation(conversationId)}
        alignItems="flex-start"
        sx={{
          backgroundColor:
            conversationId === conversationRoomId
              ? "var(--color-light-gray)"
              : "inherit",
          ":hover": {
            bgcolor: "var(--color-text-primary)",
          },
        }}
      >
        <ChatPreview>
          <ListItemAvatar
            onClick={(e) => {
              e.stopPropagation();
              showProfileTab();
              updateUserProfileId(
                isGroupChat ? conversationId : otherUserId,
                isGroupChat
              );
            }}
          >
            <ProfileAvatar
              isOnline={isGroupChat ? false : isOnline}
              alt={isGroupChat ? groupName : username}
              url={
                isGroupChat
                  ? group_picture?.fileName
                  : profile_picture?.fileName
              }
            />
          </ListItemAvatar>
          <ChatListItemText
            primaryText={primaryText}
            secondaryText={secondaryText}
          />

          <Typography
            variant="body2"
            sx={{ fontSize: "0.7rem", color: "gray", flexShrink: 0 }}
          >
            {timeText}
          </Typography>
        </ChatPreview>
      </ListItemButton>
    );
  }
);
ChatListItem.displayName = "ChatListItem";

export default ChatListItem;
const ChatPreview = styled(Grid2)({
  width: "100%",
  height: "50px",
  display: "flex",
  alignItems: "center",
});
