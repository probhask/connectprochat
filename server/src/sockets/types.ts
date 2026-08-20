import { DefaultEventsMap, Server, Socket } from "socket.io";

/** Per-socket state set by handlers/connection.ts once authenticate succeeds. */
export interface SocketData {
  userId?: string;
}

// Event payloads aren't strictly typed per-event (that needs a much larger
// ClientToServerEvents/ServerToClientEvents interface than this app's
// handful of events warrants) — socket.io's own DefaultEventsMap keeps
// `.emit`/`.on` permissive without resorting to an explicit `any` here.
// Only socket.data carries a real type.
export type AppServer = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
export type AppSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
