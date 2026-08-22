import { FRIEND_REQUEST, SHORT_USER } from "types";
import { addInitialUserData, removeUser } from "@store/slices/exploreUsers";
import { useCallback, useEffect, useState } from "react";
import { useChatAppDispatch } from "@store/hooks";

import { addSentRequest } from "@store/slices/friendRequest";
import toast from "react-hot-toast";
import useFetchData from "./useFetchData";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// Matches lib/services/paginate-query's PaginationResult shape.
type ExplorePage = {
  results: SHORT_USER[];
  pagination: { limit: number; page: number; total: number; totalPages: number };
};

const limit = 10;

const useExplore = () => {
  const [page, setPage] = useState(1);
  const dispatch = useChatAppDispatch();
  const [isMoreAvailable, setIsMoreAvailable] = useState(false);
  const [currentReceiverId, setCurrentReceiverId] = useState<string | null>(
    null
  );

  // /user/explore is self-scoped via the token now (no userId param), and
  // the response shape changed: { users, currentPage, totalPages,
  // totalUsers } -> { data: { results, pagination: { page, totalPages } } }
  // (lib/services/paginate-query's PaginationResult).
  const [
    exploreResp,
    exploreLoading,
    exploreError,
    exploreFetchData,
    exploreAbort,
  ] = useFetchData<ApiEnvelope<ExplorePage>>(
    "/user/explore",
    "GET",
    {
      params: { page, limit },
    },
    true
  );
  const fetchUsers = useCallback(async () => {
    exploreFetchData();
  }, [exploreFetchData]);

  useEffect(() => {
    const exploreData = exploreResp?.data;
    if (!exploreData) return;

    dispatch(addInitialUserData([...exploreData.results]));
    setIsMoreAvailable(
      exploreData.pagination.page < exploreData.pagination.totalPages
    );
  }, [exploreResp, dispatch]);

  const [
    sendRequestResp,
    sendRequestLoading,
    sendRequestError,
    sendRequestFetchData,
    sendRequestAbort,
  ] = useFetchData<ApiEnvelope<FRIEND_REQUEST>>(
    "/friendRequest/send",
    "POST",
    {},
    false
  );
  const sendFriendRequest = useCallback(
    async (receiverId: string) => {
      if (receiverId) {
        setCurrentReceiverId(receiverId);
        sendRequestFetchData({
          data: { receiverId },
        });
      }
    },
    [sendRequestFetchData]
  );

  useEffect(() => {
    if (sendRequestResp?.data?._id && currentReceiverId) {
      dispatch(addSentRequest(sendRequestResp.data));
      dispatch(removeUser(currentReceiverId));
      setCurrentReceiverId(null);
      toast.success("Request sent successfully");
    }
  }, [sendRequestResp, dispatch, currentReceiverId]);

  useEffect(() => {
    if (sendRequestError && !sendRequestLoading) {
      toast.error("Failed to send request");
    }
  }, [sendRequestError, sendRequestLoading]);

  useEffect(() => {
    return () => {
      sendRequestAbort();
      exploreAbort();
    };
  }, []);

  return {
    fetchUsers,
    exploreLoading,
    exploreError,
    page,
    isMoreAvailable,
    sendFriendRequest,
    friendRequestReceiver: currentReceiverId,
    sendRequestLoading,
    sendRequestError,
    setPage,
  };
};

export default useExplore;
