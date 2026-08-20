/**
 * Typed TanStack Query key factory — the equivalent of RTK Query's cache
 * tags. Socket-driven cache updates (contexts/socket/*) and invalidations
 * reference these same keys, so there's exactly one place a query's
 * identity is spelled out.
 */
export const queryKeys = {
  user: {
    detail: (id: string) => ["user", id] as const,
    explore: (params: { page?: number; limit?: number; search?: string }) =>
      ["user", "explore", params] as const,
    friends: () => ["user", "friends"] as const,
    sideProfile: (profileId: string, isGroup: boolean) =>
      ["user", "side-profile", profileId, isGroup] as const,
  },
  friendRequest: {
    all: (requestType?: string) => ["friendRequest", requestType ?? "all"] as const,
  },
  conversation: {
    detail: (id: string) => ["conversation", id] as const,
    chatList: () => ["conversation", "chat-list"] as const,
    messages: (conversationId: string) =>
      ["conversation", conversationId, "messages"] as const,
  },
} as const;
