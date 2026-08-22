import { Socket, io } from "socket.io-client";
import { createContext, useContext, useEffect, useMemo } from "react";

import type { FRIEND, FRIEND_REQUEST, MESSAGE } from "types";
import { queryKeys } from "@hooks/queryKeys";
import toast from "react-hot-toast";
import { useChatAppSelector } from "@store/hooks";
import { useQueryClient } from "@tanstack/react-query";
import useChatAppContext from "@context/index";

type SocketContextType = {
  socket: Socket;
};

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

/**
 * Actually wires the `authenticate` handshake now — this was written but
 * commented out (a no-op), so the server's `sockets/handlers/connection.ts`
 * authenticate handler was reachable but never actually called by anything.
 * Matches the event names in server/src/sockets/constants.ts's SocketEvent.
 *
 * Also, Phase 5: joins/leaves the open conversation's room and listens
 * for messageReceived (real-time chat messages), and listens for
 * friendRequestReceived/friendRequestAccepted on the personal room every
 * authenticated socket joins (see sockets/handlers/connection.ts) — a
 * sent/accepted friend request now reaches the OTHER party's Friend
 * Request/Friends pages live, not just the acting user's own client.
 */
export const SocketContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const socket = useMemo(
    () => io(`${import.meta.env.VITE_BACKEND_URL}`, { autoConnect: false }),
    []
  );
  const accessToken = useChatAppSelector((store) => store.auth.accessToken);
  const { conversationRoomId } = useChatAppContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) {
      socket.disconnect();
      return;
    }

    socket.connect();
    socket.on("connect", () => {
      socket.emit("authenticate", accessToken);
    });

    return () => {
      socket.off("connect");
      socket.disconnect();
    };
  }, [accessToken, socket]);

  // Join the open conversation's room so this socket is actually in scope
  // for the server's io.to(conversationId).emit(...) broadcasts; leave it
  // on switch/close so a stale room membership doesn't keep collecting
  // events for a conversation that's no longer open.
  useEffect(() => {
    if (!conversationRoomId) return;
    socket.emit("joinConversation", conversationRoomId);
    return () => {
      socket.emit("leaveConversation", conversationRoomId);
    };
  }, [conversationRoomId, socket]);

  // One listener for the app's lifetime, not per-conversation — dedupes
  // against the HTTP response's own cache write (see useMessage.tsx's
  // appendMessage) since the sender is in the room too and gets their own
  // broadcast back.
  useEffect(() => {
    const handleMessageReceived = (message: MESSAGE) => {
      queryClient.setQueryData<MESSAGE[] | undefined>(
        queryKeys.conversation.messages(message.conversationId),
        (old) => {
          if (!old) return old;
          if (old.some((m) => m._id === message._id)) return old;
          return [...old, message];
        }
      );
      // Best-effort — only patches an already-cached chat list page
      // (there's no pagination/sorting to redo here, just keep the
      // preview text from going stale until the next real chat-list
      // fetch). Silently a no-op if the chat list hasn't been fetched
      // yet in this session.
      queryClient.setQueryData<
        | {
            conversation: { _id: string };
            lastMessage: { text: string; sender: string; media: string };
          }[]
        | undefined
      >(queryKeys.conversation.chatList(), (old) =>
        old?.map((item) =>
          item.conversation._id === message.conversationId
            ? {
                ...item,
                lastMessage: {
                  text: message.text,
                  sender: message.sender._id,
                  media: message.media?.fileName ?? "",
                },
              }
            : item
        )
      );
    };

    socket.on("messageReceived", handleMessageReceived);
    return () => {
      socket.off("messageReceived", handleMessageReceived);
    };
  }, [socket, queryClient]);

  // Real-time friend request send/accept — the server has pushed these
  // since this same pass (see modules/friendRequest/controllers.ts), but
  // nothing client-side listened, so a received/accepted request only
  // ever showed up for the other party after a manual reload/refetch of
  // the Friend Request page.
  useEffect(() => {
    const handleFriendRequestReceived = (request: FRIEND_REQUEST) => {
      queryClient.setQueryData<FRIEND_REQUEST[] | undefined>(
        queryKeys.friendRequest.all("RECEIVE"),
        (old) => {
          if (!old) return old;
          if (old.some((r) => r._id === request._id)) return old;
          return [...old, request];
        }
      );
      toast.success(`${request.sender.username} sent you a friend request`);
    };

    const handleFriendRequestAccepted = ({
      requestId,
      friend,
    }: {
      requestId: string;
      friend: FRIEND;
    }) => {
      queryClient.setQueryData<FRIEND_REQUEST[] | undefined>(
        queryKeys.friendRequest.all("SEND"),
        (old) => old?.filter((r) => r._id !== requestId)
      );
      queryClient.setQueryData<FRIEND[] | undefined>(
        queryKeys.user.friends(),
        (old) => {
          if (!old) return old;
          if (old.some((f) => f._id === friend._id)) return old;
          return [...old, friend];
        }
      );
      toast.success(`${friend.username} accepted your friend request`);
    };

    socket.on("friendRequestReceived", handleFriendRequestReceived);
    socket.on("friendRequestAccepted", handleFriendRequestAccepted);
    return () => {
      socket.off("friendRequestReceived", handleFriendRequestReceived);
      socket.off("friendRequestAccepted", handleFriendRequestAccepted);
    };
  }, [socket, queryClient]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

const useSocketContext = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      "useSocketContext hook must be used within SocketContextProvider"
    );
  }
  return context;
};

export default useSocketContext;
