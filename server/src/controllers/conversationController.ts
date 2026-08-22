import Conversation, { IConversation } from "../models/conversation";
import { Request, Response } from "express";
import {
  catchErrorResponse,
  isValidObjectId,
  sendErrorResponse,
  sendSuccessResponse,
} from "../utils/utilityFunction";

import Message from "../models/message";
import User from "../models/user";
import mongoose from "mongoose";

////////////////////////////////////////////////////////////////////////
// Get Conversation Details
export const getConversation = async (req: Request, res: Response) => {
  const { conversationId, userId } = req.query;
  if (
    !conversationId ||
    !userId ||
    !isValidObjectId(conversationId as string) ||
    !isValidObjectId(userId as string)
  ) {
    sendErrorResponse(res, 400, "Invalid or missing conversationId or userId.");
    return;
  }
  try {
    const foundConversation = await Conversation.findOne({
      _id: conversationId,
    }).populate({
      path: "participants",
      select: "username _id profile_picture isOnline lastSeen",
      populate: {
        path: "profile_picture",
        model: "Upload",
        select: "path _id mimetype originalName fileName fullPath",
      },
    });

    if (!foundConversation) {
      sendErrorResponse(res, 400, "Conversation not found");
      return;
    }
    // if  group chat return conversation data
    if (foundConversation.isGroupChat) {
      res.status(201).json(foundConversation);
      return;
    }

    // if not group chat
    const otherParticipant = foundConversation.participants.find(
      (participant: any) => participant._id.toString() != userId
    );

    if (otherParticipant) {
      // Response-shaping only (foundConversation is never saved after this) —
      // replaces the full participants array with just the other participant
      // for 1:1-chat display. Cast via `unknown` per TS's own suggestion since
      // the in-memory shape intentionally diverges from IConversation here.
      foundConversation.participants = {
        ...otherParticipant,
      } as unknown as IConversation["participants"];
      res.status(201).json({
        ...foundConversation.toObject(),
        participants: otherParticipant,
      });
      return;
    }
  } catch (error) {
    catchErrorResponse(res, error);
    return;
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////
// If return conversation room if exist return existing if not create new
export const getConversationRoom = async (req: Request, res: Response) => {
  const { userIds } = req.query as { userIds: string[] };

  if (
    !userIds ||
    !Array.isArray(userIds) ||
    userIds.length !== 2 ||
    !userIds.every(isValidObjectId)
  ) {
    sendErrorResponse(res, 400, "Provide exactly two user IDs in array.");
    return;
  }

  try {
    //find  both user in database
    const [userA, userB] = await Promise.all([
      await User.findById(userIds[0]),
      await User.findById(userIds[1]),
    ]);

    // if both are in db
    if (!userA || !userB) {
      sendErrorResponse(res, 404, "One or both user user not found");
      return;
    }

    // find if both are friend
    const isUserAFriendOfB = userA.friends.some((friendId) =>
      (friendId as mongoose.Types.ObjectId).equals(userB._id.toString())
    );
    const isUserBFriendOfA = userB.friends.some((friendId) =>
      (friendId as mongoose.Types.ObjectId).equals(userA._id.toString())
    );

    if (
      !userA.friends.includes(userB._id) ||
      !userB.friends.includes(userA._id)
    ) {
      sendErrorResponse(res, 404, "User's are not friend");
      return;
    }

    // find  if conversation already exist
    const existingConversation = await Conversation.findOne({
      participants: {
        $all: userIds.map((id) => new mongoose.Types.ObjectId(id)),
        $size: userIds.length,
      },
      isGroupChat: false,
    });

    if (existingConversation) {
      const conversation = existingConversation;
      res.status(200).json(conversation);
      return;
    }

    // create new conversation
    const newConversation = await Conversation.create({
      participants: userIds.map((id) => new mongoose.Types.ObjectId(id)),
      isGroupChat: false,
    });

    const conversation = newConversation;
    res.status(201).json(conversation);
    return;
  } catch (error) {
    catchErrorResponse(res, error);
  }
};

////////////////////////////////////////////////////////////////
// create new conversation
export const createConversation = async (req: Request, res: Response) => {
  const {
    userId,
    isGroupChat,
    groupName,
  }: { userId: string[]; isGroupChat: boolean; groupName?: string } = req.body;

  if (
    !userId ||
    !Array.isArray(userId) ||
    userId.length === 0 ||
    userId.every(isValidObjectId)
  ) {
    sendErrorResponse(res, 400, "Provide valid user IDs in array.");
    return;
  }
  // Check for duplicate participants
  const uniqueUserIds = [...new Set(userId)];

  try {
    // Check if it's a group chat
    if (isGroupChat) {
      if (!groupName) {
        sendErrorResponse(res, 400, "Group name is required for group chats.");
        return;
      }

      // Check if a group chat with the same name already exists
      const existingGroupChat = await Conversation.findOne({
        groupName,
        isGroupChat: true,
      });

      if (existingGroupChat) {
        sendErrorResponse(
          res,
          409,
          "A group chat with the same name already exists"
        );
        return;
      }

      // Create a new group chat without checking participants
      const newGroupChat = await Conversation.create({
        participants: uniqueUserIds,
        isGroupChat: true,
        groupName,
      });

      res.status(201).json(newGroupChat);
      return;
    } else {
      // For non-group chats: check if a conversation with the same participants already exists
      const existingConversation = await Conversation.findOne({
        participants: { $all: uniqueUserIds, $size: uniqueUserIds.length },
        isGroupChat: false,
      });

      if (existingConversation) {
        sendErrorResponse(
          res,
          409,
          "Conversation with these participants already exists."
        );
        return;
      }

      // Create new non-group conversation
      const newConversation = await Conversation.create({
        participants: uniqueUserIds,
        isGroupChat: false,
      });

      res.status(201).json(newConversation);
      return;
    }
  } catch (error) {
    catchErrorResponse(res, error);
  }
};

////////////////////////////////////////////////////////////////////////
// Delete Conversation
// TODO:delete media in message
export const deleteConversation = async (req: Request, res: Response) => {
  const { conversationId } = req.body;

  if (!conversationId || isValidObjectId(conversationId)) {
    sendErrorResponse(res, 400, "Invalid or missing ConversationId");
    return;
  }
  try {
    // Check if the conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      sendErrorResponse(res, 404, "Conversation not found");
      return;
    }

    await Promise.all([
      // Delete all messages associated with the conversation
      Message.deleteMany({
        conversationId: new mongoose.Types.ObjectId(conversationId as string),
      }),
      // Delete the conversation
      Conversation.findByIdAndDelete(conversationId),
    ]);

    sendSuccessResponse(
      res,
      "Conversation and related messages deleted successfully"
    );
    return;
  } catch (error) {
    catchErrorResponse(res, error);
  }
};

////////////////////////////////////////////////////////////////////////
// Add Participants to conversation (group)
export const addParticipantsToConversation = async (
  req: Request,
  res: Response
) => {
  const { conversationId, participantIds } = req.body;
  // Validate request
  if (
    !conversationId ||
    !participantIds ||
    !Array.isArray(participantIds) ||
    !isValidObjectId(conversationId) ||
    participantIds.length === 0
  ) {
    sendErrorResponse(res, 400, "Invalid conversationId and participantIds.");
    return;
  }

  try {
    // Find the conversation by ID
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      sendErrorResponse(res, 400, "Conversation not found.");
      return;
    }

    // Check if it is a group chat
    if (!conversation.isGroupChat) {
      sendErrorResponse(
        res,
        400,
        "Cannot add participants to a one-on-one conversation."
      );
      return;
    }
    // valid participants
    const validParticipants = await User.find({
      _id: { $in: participantIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });
    if (validParticipants.length !== participantIds.length) {
      sendErrorResponse(res, 400, "One or more participant IDs are invalid.");
      return;
    }

    // Add participants to the conversation if they are not already in the list
    const newParticipants = participantIds.filter(
      (id: string) =>
        !conversation.participants.includes(new mongoose.Types.ObjectId(id))
    );

    if (newParticipants.length === 0) {
      sendErrorResponse(
        res,
        400,
        "All provided participants are already in the conversation."
      );

      return;
    }

    // Update conversation with new participants
    conversation.participants.push(
      ...newParticipants.map((id: string) => new mongoose.Types.ObjectId(id))
    );
    await conversation.save();

    res
      .status(200)
      .json({ message: "Participants added successfully.", conversation });
  } catch (error) {
    catchErrorResponse(res, error);
  }
};

////////////////////////////////////////////////////////////////////////
// removeParticipants from conversation (group)
export const removeParticipantsFromConversation = async (
  req: Request,
  res: Response
) => {
  const { conversationId, participantIds } = req.body;
  if (
    !conversationId ||
    !participantIds ||
    !Array.isArray(participantIds) ||
    !isValidObjectId(conversationId) ||
    participantIds.length === 0
  ) {
    sendErrorResponse(res, 400, "Invalid conversationId and participantIds.");
    return;
  }
  try {
    // Find the conversation by ID
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      sendErrorResponse(res, 404, "Conversation not found");
      return;
    }

    // Check if it is a group chat
    if (!conversation.isGroupChat) {
      sendErrorResponse(
        res,
        400,
        "Cannot add participants to a one-on-one conversation."
      );
      return;
    }

    // Ensure that the participants to be removed are part of the conversation
    const participantsToRemove = participantIds.filter((id: string) =>
      conversation.participants.includes(new mongoose.Types.ObjectId(id))
    );

    if (participantsToRemove.length === 0) {
      sendErrorResponse(
        res,
        400,
        "None of the provided participants are part of the conversation."
      );
      return;
    }

    // Remove participants from the conversation
    conversation.participants = conversation.participants.filter((id) => {
      // Cast id to mongoose.Types.ObjectId explicitly
      const participantId = id as mongoose.Types.ObjectId;
      return !participantIds.includes(participantId.toString());
    });

    await conversation.save();

    res
      .status(200)
      .json({ message: "Participants removed successfully.", conversation });
  } catch (error) {
    console.error("Error removing participants:");
    catchErrorResponse(res, error);
  }
};
