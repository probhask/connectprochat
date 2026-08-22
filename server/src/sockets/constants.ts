/**
 * Named socket events, replacing the pre-revamp `"receivedMessage"` /
 * `"receiveMessage"` duplication (two near-identical event names firing per
 * message — clearly refactor leftover, not intentional).
 */
export const SocketEvent = {
  // Client -> server
  AUTHENTICATE: "authenticate",
  JOIN_CONVERSATION: "joinConversation",
  LEAVE_CONVERSATION: "leaveConversation",
  SEND_MESSAGE: "sendMessage",
  // Server -> client
  AUTHENTICATED: "authenticated",
  AUTH_ERROR: "authError",
  MESSAGE_RECEIVED: "messageReceived",
  PRESENCE_CHANGED: "presenceChanged",
  FRIEND_REQUEST_RECEIVED: "friendRequestReceived",
  FRIEND_REQUEST_ACCEPTED: "friendRequestAccepted",
  ERROR: "error",
} as const;

export type SocketEvent = (typeof SocketEvent)[keyof typeof SocketEvent];
