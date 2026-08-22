import type {
  CANCEL_TYPE,
  FRIEND,
  RECEIVE_FRIEND_REQUEST,
  SENT_FRIEND_REQUEST,
  TAB_FRIENDS_REQUEST,
} from "types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getSessionStorage, storeToSessionStorage } from "@utils/localStorage";
import { httpClient } from "@services/apis/httpClient";
import { queryKeys } from "./queryKeys";
import toast from "react-hot-toast";
import { useState } from "react";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

const SENT_KEY = queryKeys.friendRequest.all("SEND");
const RECEIVED_KEY = queryKeys.friendRequest.all("RECEIVE");

/**
 * Phase 5 — friend requests are server cache, migrated onto TanStack
 * Query. Both the sent and received lists are fetched eagerly (not
 * lazily per active tab, like the pre-migration version) since
 * FriendRequestPage shows a pending-count badge on BOTH tabs at once
 * regardless of which is active — that needs both lists loaded either
 * way, so there's no lazy-fetch win left to keep.
 */
const useFriendRequest = () => {
  const queryClient = useQueryClient();
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);
  const [acceptRequestId, setAcceptRequestId] = useState<string | null>(null);

  //------------------------------ send and receive tabs---------------------------//
  const [tab, setTab] = useState<TAB_FRIENDS_REQUEST>(
    getSessionStorage<TAB_FRIENDS_REQUEST>("tab-friend-request") || "received"
  );
  const changeTab = (tab: TAB_FRIENDS_REQUEST) => {
    storeToSessionStorage("tab-friend-request", tab);
    setTab(tab);
  };

  //------------------------------ sent friend request---------------------------//
  const {
    data: sentRequests = [],
    isLoading: sentLoading,
    isError: sentError,
  } = useQuery({
    queryKey: SENT_KEY,
    queryFn: async () => {
      const response = await httpClient.get<
        ApiEnvelope<{ sent: SENT_FRIEND_REQUEST }>
      >("/friendRequest", { params: { requestType: "SEND" } });
      return response.data.data.sent;
    },
  });

  //------------------------------ received friend request---------------------------//
  const {
    data: receivedRequests = [],
    isLoading: receivedLoading,
    isError: receivedError,
  } = useQuery({
    queryKey: RECEIVED_KEY,
    queryFn: async () => {
      const response = await httpClient.get<
        ApiEnvelope<{ received: RECEIVE_FRIEND_REQUEST }>
      >("/friendRequest", { params: { requestType: "RECEIVE" } });
      return response.data.data.received;
    },
  });

  // 3️⃣ Accept — also writes the new friend straight into
  // queryKeys.user.friends()'s cache (see useFriend.tsx) so the Friends
  // page reflects it immediately without a separate Redux slice to keep
  // in sync.
  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await httpClient.put<ApiEnvelope<{ user: FRIEND }>>(
        "/friendRequest",
        { requestId }
      );
      return response.data.data.user;
    },
    onMutate: (requestId: string) => setAcceptRequestId(requestId),
    onSuccess: (user, requestId) => {
      queryClient.setQueryData<RECEIVE_FRIEND_REQUEST | undefined>(
        RECEIVED_KEY,
        (old) => old?.filter((r) => r._id !== requestId)
      );
      queryClient.setQueryData<FRIEND[] | undefined>(
        queryKeys.user.friends(),
        (old) => (old ? [...old, user] : old)
      );
      toast.success("Friend added successfully");
    },
    onError: () => toast.error("Failed to Add Friend"),
    onSettled: () => setAcceptRequestId(null),
  });

  // 4️⃣ Cancel — a sent request being cancelled and a received request
  // being rejected are the same server call, distinguished only by which
  // cached list needs the entry removed from.
  const cancelMutation = useMutation({
    mutationFn: async ({ requestId }: { requestId: string; cancelType: CANCEL_TYPE }) => {
      await httpClient.delete("/friendRequest", { data: { requestId } });
    },
    onMutate: ({ requestId }) => {
      setCancelRequestId(requestId);
    },
    onSuccess: (_data, { requestId, cancelType }) => {
      const key = cancelType === "SEND" ? SENT_KEY : RECEIVED_KEY;
      queryClient.setQueryData<
        SENT_FRIEND_REQUEST | RECEIVE_FRIEND_REQUEST | undefined
      >(key, (old) => old?.filter((r) => r._id !== requestId));
      toast.success("Request removed successfully");
    },
    onError: () => toast.error("Failed to remove request"),
    onSettled: () => {
      setCancelRequestId(null);
    },
  });

  return {
    tab,
    changeTab,

    sentRequests,
    sentLoading,
    sentError,

    receivedRequests,
    receivedLoading,
    receivedError,

    handleAcceptRequest: acceptMutation.mutate,
    acceptLoading: acceptMutation.isPending,
    acceptError: acceptMutation.isError,
    acceptRequestId,

    handleCancelRequest: (requestId: string, cancelType: CANCEL_TYPE) =>
      cancelMutation.mutate({ requestId, cancelType }),
    cancelLoading: cancelMutation.isPending,
    cancelError: cancelMutation.isError,
    cancelRequestId,
  };
};

export default useFriendRequest;
