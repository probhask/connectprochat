import { Router } from "express";

import verifyJWT from "../../middlewares/verifyJWT";
import {
  addParticipants,
  createConversation,
  deleteConversation,
  getChatList,
  getConversation,
  getOrCreateDirectConversation,
  removeParticipants,
} from "./controllers/conversation.controllers";
import {
  deleteMessages,
  getMessages,
  sendMessage,
  updateMessageStatus,
} from "./controllers/message.controllers";

const router = Router();
router.use(verifyJWT);

router.get("/chat-list", getChatList);
router.get("/direct/:otherUserId", getOrCreateDirectConversation);
router.post("/", createConversation);

router.delete("/messages", deleteMessages);

router.get("/:id", getConversation);
router.delete("/:id", deleteConversation);
router.put("/:id/participants", addParticipants);
router.delete("/:id/participants", removeParticipants);

router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.put("/:id/messages/status", updateMessageStatus);

export default router;
