import { FRIEND_REQUEST, SENT_FRIEND_REQUEST, SHORT_USER } from "types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { httpClient } from "@services/apis/httpClient";
import { queryKeys } from "./queryKeys";
import toast from "react-hot-toast";
import { useState } from "react";

/** Server always wraps responses as { success, message, data }. */
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// Matches lib/services/paginate-query's PaginationResult shape.
type ExplorePage = {
  results: SHORT_USER[];
  pagination: { limit: number; page: number; total: number; totalPages: number };
};

const limit = 10;

/**
 * First slice migrated off Redux onto TanStack Query (Phase 5) — explore
 * results are server cache, not app/session state, so they belong in the
 * query cache (own loading/error tracking, refetch-on-focus, no manual
 * "initial" reducer to keep in sync) rather than a Redux slice someone has
 * to remember to dispatch into. sendFriendRequest also writes straight
 * into queryKeys.friendRequest.all("SEND")'s cache (see
 * useFriendRequest.tsx, migrated the same way) so the Friend Request
 * page's Sent tab picks it up without a shared Redux slice.
 */
const useExplore = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const [currentReceiverId, setCurrentReceiverId] = useState<string | null>(
    null
  );

  const queryKey = queryKeys.user.explore({ page, limit });

  const {
    data,
    isLoading: exploreLoading,
    isError: exploreError,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await httpClient.get<ApiEnvelope<ExplorePage>>(
        "/user/explore",
        { params: { page, limit } }
      );
      return response.data.data;
    },
    // Keep the previous page's results on screen while the next page
    // loads, instead of flashing empty/loading between pages.
    placeholderData: (previous) => previous,
  });

  const users = data?.results ?? [];
  const isMoreAvailable = data
    ? data.pagination.page < data.pagination.totalPages
    : false;

  const sendRequestMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      const response = await httpClient.post<ApiEnvelope<FRIEND_REQUEST>>(
        "/friendRequest/send",
        { receiverId }
      );
      return response.data.data;
    },
    onMutate: (receiverId: string) => {
      setCurrentReceiverId(receiverId);
    },
    onSuccess: (friendRequest, receiverId) => {
      queryClient.setQueryData<SENT_FRIEND_REQUEST | undefined>(
        queryKeys.friendRequest.all("SEND"),
        (old) => (old ? [...old, friendRequest] : old)
      );
      // Optimistically drop the now-requested user out of the cached
      // explore page rather than waiting on a refetch.
      queryClient.setQueryData<ExplorePage | undefined>(queryKey, (old) =>
        old
          ? { ...old, results: old.results.filter((u) => u._id !== receiverId) }
          : old
      );
      toast.success("Request sent successfully");
    },
    onError: () => {
      toast.error("Failed to send request");
    },
    onSettled: () => {
      setCurrentReceiverId(null);
    },
  });

  return {
    users,
    exploreLoading,
    exploreError,
    page,
    isMoreAvailable,
    sendFriendRequest: sendRequestMutation.mutate,
    friendRequestReceiver: currentReceiverId,
    sendRequestLoading: sendRequestMutation.isPending,
    sendRequestError: sendRequestMutation.isError,
    setPage,
  };
};

export default useExplore;
