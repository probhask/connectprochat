import React, { createContext, useContext } from "react";

import type { FRIEND } from "types";
import useFriend from "@hooks/useFriend";

type FriendContextType = {
  friends: FRIEND[];
  friendError: boolean;
  friendLoading: boolean;
  removeFriendId: string | null;
  unfriendError: boolean;
  unfriendLoading: boolean;
  handleUnfriendUser: (friendId: string) => void;
  conversationFriendId: string | null;
  conversationRoomLoading: boolean;
  handleFindConversationRoom: (friendId: string) => void;
};

export const FriendContext = createContext<FriendContextType | undefined>(
  undefined
);

export const FriendContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const {
    //fetch friend
    friends,
    friendError,
    friendLoading,
    //unfriend
    removeFriendId,
    unfriendError,
    unfriendLoading,
    handleUnfriendUser,
    //enter conversation room
    conversationFriendId,
    conversationRoomLoading,
    handleFindConversationRoom,
  } = useFriend();

  const values = {
    //fetch friend
    friends,
    friendError,
    friendLoading,
    //unfriend
    removeFriendId,
    unfriendError,
    unfriendLoading,
    handleUnfriendUser,
    //enter conversation room
    conversationFriendId,
    conversationRoomLoading,
    handleFindConversationRoom,
  };

  return (
    <FriendContext.Provider value={values}>{children}</FriendContext.Provider>
  );
};

const useFriendContext = () => {
  const context = useContext(FriendContext);
  if (!context) {
    throw new Error(
      "useFriendContext hook must be used within FriendContextProvider"
    );
  }
  return context;
};

export default useFriendContext;
