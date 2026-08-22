import { Server, Socket } from "socket.io";

import Conversation from "../models/conversation";
import { Server as HttpServer } from "http";
import type { MESSAGE } from "../types";
import { verifySocketJWT } from "../utils/verifySocketJWT";

interface SocketUser {
  userId: string;
  socketId: string;
}
// const users:{[key:string]:string}={}  //{userId:socketId}
// const conversation={[key:string]:Conversation}={} // {conversationId:Conversation}

const activeUsers: SocketUser[] = [];

// socket.emit("welcome", `Welcome to server (emit)`); // emit to socket
// socket.broadcast.emit(
//   "welcome",
//   ` ${socket.id} joined the server (broadcast)`
// ); // msg to others except this socket

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      optionsSuccessStatus: 200,
    },
  });
  // const users: { [socketId: string]: User } = {};

  io.on("connection", (socket: Socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Handle user authentication via JWT
    socket.on("authenticate", async (token: string) => {
      const userId = await verifySocketJWT(token);
      if (userId) {
        activeUsers.push({ userId, socketId: socket.id });
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
      } else {
        console.warn("JWT authentication failed");
        socket.disconnect(true);
      }
    });

    // Join conversation
    socket.on("joinConversation", (conversationId: string) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    // On send message
    socket.on("sendMessage", async (message: MESSAGE) => {
      const conversation = await Conversation.findById(message.conversationId);
      if (conversation) {
        const participants = conversation.participants as unknown as string[];
        participants.forEach((participant) => {
          if (participant !== message.sender._id) {
            socket.broadcast.emit("receiveMessage", message);
          }
        });
      } else {
        console.error(
          `Conversation with ID ${message.conversationId} not found`
        );
      }
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      const user = activeUsers.find((user) => user.socketId === socket.id);
      if (user) {
        // Remove the user from activeUsers on disconnect
        activeUsers.splice(activeUsers.indexOf(user), 1);
        console.log(`User ${user.userId} disconnected: ${socket.id}`);
      } else {
        console.log(`User disconnected: ${socket.id}`);
      }
    });
  });
};
