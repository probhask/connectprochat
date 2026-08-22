import type {
  CANCEL_TYPE,
  FRIEND,
  RECEIVE_FRIEND_REQUEST,
  SENT_FRIEND_REQUEST,
  TAB_FRIENDS_REQUEST,
} from "types";
import {
  addInitialReceivedFriendRequestData,
  addInitialSentFriendRequestData,
  removeReceivedRequest,
  removeSentRequest,
} from "@store/slices/friendRequest";
import { getSessionStorage, storeToSessionStorage } from "@utils/localStorage";
import { useCallback, useEffect, useState } from "react";
import { useChatAppDispatch } from "@store/hooks";

import { addFriend } from "@store/slices/friends";
import toast from "react-hot-toast";
import useFetchData from "./useFetchData";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

const useFriendRequest = () => {
  const dispatch = useChatAppDispatch();
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);
  const [acceptRequestId, setAcceptRequestId] = useState<string | null>(null);
  const [cancelType, setCancelType] = useState<CANCEL_TYPE | null>(null);
  //------------------------------ send and receive tabs---------------------------//

  const [tab, setTab] = useState<TAB_FRIENDS_REQUEST>(
    getSessionStorage<TAB_FRIENDS_REQUEST>("tab-friend-request") || "received"
  );
  // handle tab change for friend request
  const changeTab = (tab: TAB_FRIENDS_REQUEST) => {
    storeToSessionStorage("tab-friend-request", tab);
    setTab(tab);
  };

  useEffect(() => {
    const tab = getSessionStorage<TAB_FRIENDS_REQUEST>("tab-friend-request");
    if (tab) {
      setTab(tab);
    } else {
      setTab("sent");
    }
  }, []);

  //------------------------------ sent friend  request---------------------------//
  // 1️⃣  Sent Friend Requests (GET Request) — self-scoped via the token now,
  // no userId param. Response is { data: { sent: [...] } } for this filter,
  // not a flat array.
  const [
    sentFriendReqResp,
    sentLoading,
    sentError,
    fetchSentRequests,
    abortSentRequest,
  ] = useFetchData<ApiEnvelope<{ sent: SENT_FRIEND_REQUEST }>>(
    "/friendRequest",
    "GET",
    { params: { requestType: "SEND" } },
    false
  );
  useEffect(() => {
    if (sentFriendReqResp?.data?.sent) {
      dispatch(addInitialSentFriendRequestData([...sentFriendReqResp.data.sent]));
    }
  }, [sentFriendReqResp, dispatch]);

  const handleFetchSentRequest = useCallback(async () => {
    fetchSentRequests();
  }, [fetchSentRequests]);

  //2️⃣  Received Friend Requests (GET Request) — same shape change.
  const [
    receivedFriendReqResp,
    receivedLoading,
    receivedError,
    fetchReceiveFriendRequests,
    abortReceivedRequests,
  ] = useFetchData<ApiEnvelope<{ received: RECEIVE_FRIEND_REQUEST }>>(
    "/friendRequest",
    "GET",
    { params: { requestType: "RECEIVE" } },
    false
  );

  useEffect(() => {
    if (receivedFriendReqResp?.data?.received) {
      dispatch(
        addInitialReceivedFriendRequestData([...receivedFriendReqResp.data.received])
      );
    }
  }, [receivedFriendReqResp, dispatch]);

  const handleFetchReceivedRequest = useCallback(async () => {
    fetchReceiveFriendRequests();
  }, [fetchReceiveFriendRequests]);

  //------------------------------ received friend  request---------------------------//

  // 3️⃣   Accept Friend Requests (PUT Request) — same path/body, response
  // now wraps { user } under .data.
  const [
    acceptFriendReqResp,
    acceptLoading,
    acceptError,
    acceptFriendRequest,
    abortAcceptRequest,
  ] = useFetchData<ApiEnvelope<{ user: FRIEND }>>(
    "/friendRequest",
    "PUT",
    {},
    false
  );

  const handleAcceptRequest = useCallback(
    async (requestId: string) => {
      if (!requestId) {
        return;
      }
      setAcceptRequestId(requestId);
      acceptFriendRequest({
        data: {
          requestId,
        },
      });
    },
    [acceptFriendRequest]
  );
  useEffect(() => {
    if (acceptFriendReqResp?.data?.user && acceptRequestId) {
      dispatch(addFriend(acceptFriendReqResp.data.user)); // add friend in redux
      dispatch(removeReceivedRequest(acceptRequestId)); // remove receive request redux
      setAcceptRequestId(null); // remove accept request id
      toast.success("Friend added successfully");
    }
  }, [acceptFriendReqResp, dispatch, acceptRequestId]);

  // toast error
  useEffect(() => {
    if (acceptError && !acceptLoading) {
      toast.error("Failed to Add Friend");
    }
  }, [acceptError, acceptLoading]);

  // 4️⃣ Cancel Friend Requests (DELETE Request) — same path/body.
  const [
    cancelFriendReqResp,
    cancelLoading,
    cancelError,
    cancelFriendRequest,
    abortCancelRequest,
  ] = useFetchData<ApiEnvelope<null>>("/friendRequest", "DELETE", {}, false);

  const handleCancelRequest = useCallback(
    async (requestId: string, cancelType: CANCEL_TYPE) => {
      if (!requestId || !cancelType) {
        return;
      } else {
        setCancelType(cancelType);
        setCancelRequestId(requestId);
        cancelFriendRequest({
          data: {
            requestId,
          },
        });
      }
    },
    [cancelFriendRequest]
  );

  useEffect(() => {
    if (cancelFriendReqResp?.success && cancelRequestId && cancelType) {
      if (cancelType === "SEND") {
        dispatch(removeSentRequest(cancelRequestId)); //remove sent request from redux
      } else if (cancelType === "RECEIVE") {
        dispatch(removeReceivedRequest(cancelRequestId));
      }
      setCancelRequestId(null); // clear cancel request id
      setCancelType(null); //remove cancel type
      toast.success("Request removed successfully");
    }
  }, [cancelFriendReqResp, dispatch, cancelRequestId, cancelType]);

  // toast error
  useEffect(() => {
    if (cancelError && !cancelLoading) {
      toast.error("Failed to remove request");
    }
  }, [cancelError, cancelLoading]);
  //   CleanUp Abort on Unmount
  useEffect(() => {
    return () => {
      abortSentRequest();
      abortReceivedRequests();
      abortCancelRequest();
      abortAcceptRequest();
    };
  }, []);

  return {
    tab,
    changeTab,

    handleFetchSentRequest,
    abortSentRequest,
    sentLoading,
    sentError,

    handleFetchReceivedRequest,
    abortReceivedRequests,
    receivedLoading,
    receivedError,

    handleAcceptRequest,
    acceptLoading,
    acceptError,
    acceptRequestId,
    abortAcceptRequest,

    handleCancelRequest,
    cancelLoading,
    cancelError,
    cancelRequestId,
    abortCancelRequest,
  };
};

export default useFriendRequest;
