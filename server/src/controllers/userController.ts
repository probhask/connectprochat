import { Request, Response } from "express";

import Conversation from "../models/conversation";
import FriendRequest from "../models/friendRequest";
import Message from "../models/message";
import Upload from "../models/upload";
import User from "../models/user";
import bcrypt from "bcrypt";
import { deleteMedia } from "../utils/deleteMedia";
import mongoose from "mongoose";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    // id provided
    if (userId) {
      const user = await User.findById(userId)
        .select("-password -refreshToken -createdAt -updatedAt -friends")
        .populate(
          "profile_picture",
          "path _id mimetype originalName fileName fullPath"
        )
        .exec();
      if (user) {
        res.status(200).json(user);
        return;
      } else {
        res.status(404).json({ message: "User not found" });
        return;
      }
    }
    // id not id provide
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getting users");
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again",
    });
  }
};
export const explore = async (req: Request, res: Response) => {
  try {
    const { userId, page = 1, limit = 10 } = req.query;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId as string)) {
      console.log("Invalid or missing userId");

      res.status(400).json({ message: "Invalid or missing userId." });
      return;
    }

    // Find the user's friends
    const user = await User.findById(userId)
      .select("-password -refreshToken -createdAt -updatedAt")
      .populate(
        "profile_picture",
        "path _id mimetype originalName fileName fullPath"
      )
      .exec();
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const friends = (user.friends as mongoose.Types.ObjectId[])?.map((friend) =>
      friend.toString()
    );

    // Find the IDs of users the current user sent a friend request to
    const sentFriendRequests = await FriendRequest.find({ sender: userId })
      .select("receiver")
      .lean();
    const sentRequestIds = sentFriendRequests.map((request) =>
      request.receiver.toString()
    );

    // Find the IDs of users who sent a friend request to the current user
    const receivedFriendRequests = await FriendRequest.find({
      receiver: userId,
    })
      .select("sender")
      .lean();
    const receivedRequestIds = receivedFriendRequests.map((request) =>
      request.sender.toString()
    );

    // Merge all the IDs to exclude: current user, friends, sent and received friend requests
    const excludedIds = [
      userId,
      ...friends,
      ...sentRequestIds,
      ...receivedRequestIds,
    ];

    // Pagination settings
    const skip =
      (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Find users excluding the current user, their friends, and users with friend requests
    const usersToExplore = await User.find({ _id: { $nin: excludedIds } })
      .select("_id username profile_picture") // Exclude sensitive data
      .populate(
        "profile_picture",
        "path _id mimetype originalName fileName fullPath"
      )
      // .skip(skip)
      // .limit(limitNumber)
      .exec();

    // Count total users excluding the filtered ones
    const totalUsers = await User.countDocuments({
      _id: { $nin: excludedIds },
    });

    // Send paginated response
    res.status(200).json({
      users: usersToExplore,
      currentPage: parseInt(page as string, 10),
      totalPages: Math.ceil(totalUsers / limitNumber),
      totalUsers,
    });
  } catch (error) {
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again!",
    });
  }
};

export const getAllUsersByName = async (req: Request, res: Response) => {
  try {
    const { name: userName } = req.query;
    if (userName) {
      const nameRegex = new RegExp(`${userName}`, "gi"); //case-insensitive search
      const users = await User.find({ username: { $regex: nameRegex } }).select(
        "-password"
      );
      res.status(200).json(users);
      return;
    } else {
      res.status(400).json({ message: "No name string provided" });
    }
  } catch (error) {
    console.error("Error in getting user by name:");
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again",
    });
  }
};

export const getUserFriends = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      console.log("getUSerFriend: No user ID provided");
      res.status(400).json({ message: "No user ID provided" });
      console.log("No user ID provided");
      return;
    }
    const user = await User.findById(userId).select("friends");

    if (user && user.friends) {
      // match user id
      const friends = await User.find({ _id: { $in: user.friends } })
        .select("-password -friends -refreshToken -updatedAt -createdAt")
        .populate(
          "profile_picture",
          "path _id mimetype originalName fileName fullPath"
        )
        .exec();
      res.status(200).json(friends);
      return;
    } else {
      res.status(404).json({ message: "User or friends not found" });
      console.log("User or friends not found");
      return;
    }
  } catch (error) {
    console.error("Error in getting user friends ");
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again",
    });
  }
};

//unfriend
export const removeFriend = async (req: Request, res: Response) => {
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      console.log("userId and friendId must be provided");
      res.status(400).json({ message: "userId and friendId must be provided" });
      return;
    }
    // validate userId and friendId
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(friendId)
    ) {
      console.log("Invalid user or friendId");
      res.status(400).json({ message: "Invalid user or friendId" });
      return;
    }

    //find the user
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    // check if both user exist
    if (!user || !friend) {
      console.log("User or friend not found");
      res.status(400).json({ message: "User or friend not found" });
      return;
    }

    console.log("logging.. ", user.friends, friendId);

    // check if friend exist in user's friend list
    if (!user.friends.includes(friendId)) {
      console.log("Friend not found in user's friends list");
      res
        .status(400)
        .json({ message: "Friend not found in user's friends list" });
      return;
    }
    //find conversation
    const existingConversation = await Conversation.findOne({
      participants: {
        $all: [user._id, friend._id].map(
          (id) => new mongoose.Types.ObjectId(id)
        ),
        $size: [user._id, friend._id].length,
      },
      isGroupChat: false,
    });

    // if conversation delete message
    if (existingConversation) {
      const messages = await Message.find({
        conversationId: existingConversation._id,
      });

      if (messages.length > 0) {
        const messageIds = messages.map((msg) => msg._id.toString());
        //delete media file for associated message
        for (const message of messages) {
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

        //delete message
        const result = await Message.deleteMany({
          _id: { $in: messageIds },
        });
      }
    }

    // Remove the friend from the user's friend list
    user.friends = user.friends.filter((id) => {
      return (id as mongoose.Types.ObjectId).toString() !== friendId;
    });

    // remove friend from user friend's friend list
    friend.friends = friend.friends.filter((id) => {
      return (id as mongoose.Types.ObjectId).toString() !== userId;
    });

    await Conversation.findByIdAndDelete(existingConversation?._id);

    // save both user and friend
    await Promise.all([user.save(), friend.save()]);

    console.log("Friends removed successfully");
    res
      .status(200)
      .json({ message: "Friends removed successfully", success: true });
  } catch (error) {
    console.error("Error in removing users friend");
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again",
    });
  }
};

export const removeProfilePicture = async (req: Request, res: Response) => {
  const { userId } = req.query;
  console.log("request", req.query, req.params);

  try {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId as string)) {
      console.log("Missing or invalid userId ");
      res.status(400).json({ message: "Missing or invalid userId" });
      return;
    }

    // Check if the conversation exists
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      console.log("Conversation not found");
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    if (!foundUser.profile_picture) {
      console.log("No profile picture found");
      res.status(404).json({ message: "No profile picture found" });
      return;
    }

    const dbMedia = await Upload.findById(foundUser.profile_picture);

    //delete media
    if (dbMedia) {
      const mediaDeleted = deleteMedia(dbMedia);
      if (!mediaDeleted) {
        console.log("failed to remove  picture picture");
        res.status(404).json({ message: "failed to remove  picture picture" });
        return;
      }
    }
    const removeMedia = await Upload.findByIdAndDelete(
      foundUser.profile_picture
    );

    foundUser.profile_picture = null;
    await foundUser.save();

    res.status(200).json({
      success: true,
      message: "Profile picture is remove successfully",
    });
    return;
  } catch (error) {
    console.error("Error in removing profile picture");
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again",
    });
  }
};
export const getUserFriendsId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (userId) {
      const user = await User.findById(userId).select("friends");
      if (user) {
        res.status(200).json(user.friends || []);
        return;
      } else {
        res.status(404).json({ message: "User not found" });
        return;
      }
    } else {
      res.status(400).json({ message: "No user ID provided" });
      return;
    }
  } catch (error) {
    console.error("Error in getting user friends Id:");
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again",
    });
  }
};
export const updateProfileData = async (req: Request, res: Response) => {
  try {
    const { userId, email, username } = req.body;

    if (!(userId && email && username)) {
      res
        .status(400)
        .json({ message: "Missing Data. Require userId, username,email" });
      return;
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { username: username, email: email } },
      {
        new: true,
      }
    );
    if (updatedUser) {
      res
        .status(200)
        .json({ username: updatedUser.username, email: updatedUser.email });
      return;
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error Failed to update data",
      });
      return;
    }
  } catch (error) {
    console.error("Error in updating personal date");
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again",
    });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { userId, password, newPassword } = req.body;
    console.log("data", req.body, req.query, req.params);

    if (!(userId && password && newPassword)) {
      res.status(400).json({
        message: "Missing Data. Require userId, password,new password",
      });
      return;
    }
    const foundUser = await User.findById(userId);
    if (!foundUser) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      console.log("invalid password");
      res.status(400).json({
        message: "Invalid  password",
        success: false,
      });
      return;
    }
    console.log("password validated");

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    foundUser.password = hashedPassword;

    const updatedUser = await foundUser.save();

    if (updatedUser) {
      res
        .status(200)
        .json({ success: true, message: "Password Updated Successfully" });
      return;
    } else {
      res.status(500).json({
        success: false,
        message: "Internal server error Failed to update password",
      });
      return;
    }
  } catch (error) {
    console.error("Error in updating password");
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Server error, please try again",
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.query.id;
    if (userId) {
      const deletedUser = await User.findByIdAndDelete(userId);
      res.json({ message: "User deleted successfully", deletedUser });
    } else {
      res.status(400).json({ message: "No user ID provided" });
    }
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
