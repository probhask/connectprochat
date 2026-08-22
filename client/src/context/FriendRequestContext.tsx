import type {
  CANCEL_TYPE,
  RECEIVE_FRIEND_REQUEST,
  SENT_FRIEND_REQUEST,
  TAB_FRIENDS_REQUEST,
} from "types";
import React, { createContext, useContext } from "react";

import useFriendRequest from "@hooks/useFriendRequest";

type FriendRequestContextType = {
  acceptLoading: boolean;
  acceptError: boolean;
  handleAcceptRequest: (requestId: string) => void;
  acceptRequestId: string | null;
  cancelLoading: boolean;
  cancelError: boolean;
  handleCancelRequest: (requestId: string, cancelType: CANCEL_TYPE) => void;
  cancelRequestId: string | null;
  receivedRequests: RECEIVE_FRIEND_REQUEST;
  receivedLoading: boolean;
  receivedError: boolean;
  sentRequests: SENT_FRIEND_REQUEST;
  sentLoading: boolean;
  sentError: boolean;
  tab: TAB_FRIENDS_REQUEST;
  changeTab: (tab: TAB_FRIENDS_REQUEST) => void;
};

export const FriendRequestContext = createContext<
  FriendRequestContextType | undefined
>(undefined);

export const FriendRequestContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const {
    //accept frind request
    acceptLoading,
    acceptError,
    handleAcceptRequest,
    acceptRequestId,

    // cancel Request
    cancelLoading,
    cancelError,
    handleCancelRequest,
    cancelRequestId,

    // received friends request
    receivedRequests,
    receivedLoading,
    receivedError,

    // sent request
    sentRequests,
    sentLoading,
    sentError,

    //tabs
    tab,
    changeTab,
  } = useFriendRequest();

  const values = {
    // accept Friend request
    acceptLoading,
    acceptError,
    handleAcceptRequest,
    acceptRequestId,

    // cancel Request
    cancelLoading,
    cancelError,
    handleCancelRequest,
    cancelRequestId,

    // received friends request
    receivedRequests,
    receivedLoading,
    receivedError,

    // sent request
    sentRequests,
    sentLoading,
    sentError,

    //tabs
    tab,
    changeTab,
  };

  return (
    <FriendRequestContext.Provider value={values}>
      {children}
    </FriendRequestContext.Provider>
  );
};

const useFriendRequestContext = () => {
  const context = useContext(FriendRequestContext);
  if (!context) {
    throw new Error(
      "useFriendRequestContext hook must be used within FriendRequestContextProvider"
    );
  }
  return context;
};

export default useFriendRequestContext;
