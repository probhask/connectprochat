import { Socket, io } from "socket.io-client";
import { createContext, useContext, useEffect, useMemo } from "react";

import { useChatAppSelector } from "@store/hooks";

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
