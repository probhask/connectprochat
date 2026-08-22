import Message, { IMessage } from "../models/message";
import { Request, Response } from "express";

import Conversation from "../models/conversation";
import Upload from "../models/upload";
import User from "../models/user";
import { deleteMedia } from "../utils/deleteMedia";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import { validateMongooseId } from "../utils/validateMongooseId";

export const getMessage = async (req: Request, res: Response) => {
  const conversationId = req.query.conversationId;
  try {
    // check conversation id
    if (
      !conversationId ||
      !mongoose.Types.ObjectId.isValid(conversationId as string)
    ) {
      console.log("Missing or invalid conversationId ");
      res.status(400).json({ message: "Missing or invalid conversationId" });
      return;
    }

    // Check if the conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.log("Conversation not found");
      res.status(404).json({ message: "Conversation not found" });
      return;
    }
    // find message by conversation id
    const message = await Message.find({ conversationId })
      .populate("media", "path _id mimetype originalName fileName fullPath")
      .populate({
        path: "sender",
        select: "username _id profile_picture ",
        populate: {
          path: "profile_picture",
          model: "Upload",
          select: "path _id mimetype originalName fileName fullPath",
        },
      })
      .lean();
    if (message) {
      res.status(200).json(message);
      return;
    } else {
      console.log("Messages not found");
      res.status(404).json({ message: "Messages not found" });
    }
  } catch (error) {
    console.error("Error in getting messages:", error);
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again",
    });
    return;
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId, senderId, message } = req.body;
    // console.log(conversationId, message, senderId);
    // check if all param is provided
    if (!conversationId || !message || !senderId) {
      console.log("Conversation ID ,message and senderId is required");
      res
        .status(400)
        .json({ message: "Conversation ID, message and senderId is required" });
      return;
    }
    // check conversation id valid
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      console.log("Invalid conversation Id");
      res.status(400).json({ message: "Invalid conversation Id" });
      return;
    }
    // check sender id valid
    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      console.log("Invalid sender Id");
      res.status(400).json({ message: "Invalid sender Id" });
      return;
    }

    // Check if the conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.log("Conversation not found");
      res.status(404).json({ message: "Conversation not found" });
      return;
    }
    // check if user exist
    const isUserExist = await User.findOne({ _id: senderId });
    if (!isUserExist) {
      console.log("User not found");
      res.status(404).json({ message: "User not found" });
      return;
    }

    // create message
    const newMessage = await Message.create({
      conversationId,
      text: message,
      sender: senderId,
    });
    const updateMessage = await newMessage.populate([
      {
        path: "sender",
        select: "username _id profile_picture ",
        populate: {
          path: "profile_picture",
          model: "Upload",
          select: "path _id mimetype originalName fileName fullPath",
        },
      },
      {
        path: "media",
        select: "path _id mimetype originalName fileName fullPath",
      },
    ]);
    if (updateMessage) {
      console.log("Message created");
      res.status(200).json({ success: true, message: updateMessage });
    } else {
      console.log("Message creation failed");
      res.status(500).json({ message: "Message creation failed" });
    }
  } catch (error) {
    console.error("Error in creating Message:", error);
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again",
    });
    return;
  }
};

export const deleteMessages = async (req: Request, res: Response) => {
  try {
    const { messageIds: msgIds, userId: user_id } = req.body;
    const messageIds = msgIds.map(
      (msgId: string) => new mongoose.Types.ObjectId(msgId)
    );
    const userId = new mongoose.Types.ObjectId(user_id);
    // check if all param is provided
    if (!messageIds || !userId) {
      console.log("messageIds and userId is required");
      res.status(400).json({ message: "messageIds and userId is required" });
      return;
    }
    if (!Array.isArray(messageIds) || !(messageIds.length > 0)) {
      console.log(
        " message Id should be in array and must have atleast one element"
      );
      res.status(400).json({
        message:
          " message Id should be in array and must have atleast one element",
      });
      return;
    }
    // check message id valid
    if (
      !messageIds.some((messageId) =>
        mongoose.Types.ObjectId.isValid(messageId)
      )
    ) {
      console.log("messageID array has Invalid  Id");
      res.status(400).json({ message: "messageID array has Invalid  Id" });
      return;
    }
    // check user id valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid user Id");
      res.status(400).json({ message: "Invalid user Id" });
      return;
    }
    // find user
    const user = await User.findById(userId);
    if (!user) {
      console.log("user not found");
      res.status(400).json({ message: "User not found" });
      return;
    }
    // find message to delete
    const messagesToDelete = await Message.find({
      _id: { $in: messageIds },
      sender: userId,
    });

    if (messagesToDelete.length === 0) {
      console.log("No messages found or no message sent by the user");
      res
        .status(400)
        .json({ message: "No messages found or no message sent by the user" });
      return;
    }
    //delete media file for associated message
    for (const message of messagesToDelete) {
      if (message.media) {
        const dbMedia = await Upload.findById(message.media);

        //delete media
        if (dbMedia) {
          const mediaDeleted = deleteMedia(dbMedia);
          if (mediaDeleted) {
            console.log("media deleted successfully");
          }
        }
        const removeMedia = await Upload.findByIdAndDelete(message.media);
      }
    }

    const result = await Message.deleteMany({
      _id: { $in: messageIds },
      sender: userId,
    });

    // if no messages were deleted
    if (result.deletedCount === 0) {
      console.log("No message found or no message sent by the user");
      res.status(404).json({
        message: "No message found or no message sent by the user",
      });
      return;
    }
    // return success response
    res.status(200).json({
      message: `${result.deletedCount} message(s) deleted successfully`,
      success: true,
    });

    // messages = messages.filter((message) => {
    //   const senderId = new mongoose.Types.ObjectId(message?.sender as string);
    //   if (!senderId.equals(userId)) {
    //     return message
    //   }
    // });
  } catch (error) {
    console.error("Error in deleting Message:", error);
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again",
    });
    return;
  }
};

export const updateMessageStatus = async (req: Request, res: Response) => {
  try {
    const { messageIds: receivedMessageIds, conversationId, status } = req.body;
    let messageIds: string[] = Array.from(new Set(receivedMessageIds));
    const { userId, isReceived, isRead } = status;
    console.log(messageIds, conversationId, userId, isReceived);

    // check if params are provide
    if (!(messageIds && conversationId && status)) {
      console.warn("messageIds,conversationId,status are required");
      res
        .status(400)
        .json({ message: "messageIds,conversationId,status are required" });
      return;
    }
    // check if messageIds is array
    if (!(Array.isArray(messageIds) && messageIds.length > 0)) {
      console.warn(
        "messageIds must be an array and must have atleast one messageId"
      );
      res.status(400).json({
        message:
          "messageIds must be an array and must have atleast one messageId",
      });
      return;
    }
    // check if userId and isReceived are provide
    if (!(userId && isReceived && isRead)) {
      console.warn("To add status userId, isRead and isReceived are required");
      res.status(400).json({
        message: "To add status userId, isRead and isReceived are required",
      });
      return;
    }
    // validate messageIds
    messageIds.map((messageId) => {
      if (!validateMongooseId(messageId)) {
        console.warn(`${messageId} is invalid messageId`);
        res.status(400).json({ message: `${messageId} is invalid messageId` });
        return;
      }
    });
    // validate conversationId
    if (!validateMongooseId(conversationId)) {
      console.warn("Invalid conversationId");
      res.status(400).json({ message: "Invalid conversationId" });
      return;
    }
    // validate userId
    if (!validateMongooseId(userId)) {
      console.warn("Invalid userId");
      res.status(400).json({ message: "Invalid userId" });
      return;
    }
    // check type of isReceived and isRead
    if (typeof isReceived !== "boolean" || typeof isRead !== "boolean") {
      console.warn("isReceived, isRead must be boolean type");
      res
        .status(400)
        .json({ message: "isReceived, isRead must be boolean type" });
      return;
    }
    // check message
    let messages = await Message.find({
      _id: { $in: messageIds },
      conversationId,
    });
    if (!messages) {
      console.warn("message not found");
      res.status(400).json({ message: "message not found" });
      return;
    }

    // filter message if userId is senderId
    messages = messages.filter(
      (message) =>
        !new mongoose.Types.ObjectId(message.sender as unknown as string).equals(userId)
    );

    // check conversation
    const conversation = await Conversation.findOne({ _id: conversationId });
    if (!conversation) {
      console.warn("conversation not found");
      res.status(400).json({ message: "conversation not found" });
      return;
    }

    // // check if user exist in participants list
    if (!conversation.participants.includes(userId)) {
      console.warn("given user not part of the conversation");
      res
        .status(400)
        .json({ message: "given user not part of the conversation" });
      return;
    }

    // update message isReceived
    for (const message of messages) {
      // check if status include given user
      const userExistInStatus = message.status.some((status) =>
        status.user.equals(userId)
      );
      if (userExistInStatus) {
        for (const status of message.status) {
          if (status.user.equals(userId)) {
            status.isReceived = isReceived;
            status.isRead = isRead;
            break;
          }
        }
      } else {
        message.status.push({ user: userId, isReceived, isRead: isRead });
      }
      const updateMessage = await message.save();
      if (!updateMessage) {
        console.warn(`Failed to update status of ${message._id} message`);
        res.status(500).json({
          message: `Failed to update status of ${message._id} message`,
        });
        return;
      }
    }

    console.log("message status successfully updated");
    res.status(200).json({ message: "message status successfully updated" });
    return;
  } catch (error) {
    console.error("Error in updating message received:", error);
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again",
    });
    return;
  }
};
