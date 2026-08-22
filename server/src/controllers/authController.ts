import {
  REFRESH_TOKEN_NAME,
  catchErrorResponse,
  clearRefreshToken,
  fiveDaysInMs,
  generateAccessToken,
  generateRefreshToken,
  sendErrorResponse,
} from "../utils/utilityFunction";
import { Request, Response } from "express";

import User from "../models/user";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

dotenv.config();

////////////////////////////////////////////////////////////////////////
// Login Controller
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body; // Use req.body for better practice

    // Check if email and password are provided
    if (!email || !password) {
      sendErrorResponse(res, 400, "Provide email and password");
      return;
    }

    // Find user by email
    const user = await User.findOne({ email })
      .select("-friends")
      .populate(
        "profile_picture",
        "path _id mimetype originalName fileName fullPath"
      );
    if (!user) {
      sendErrorResponse(res, 401, "Invalid email or password");
      return;
    }

    // Compare password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      sendErrorResponse(res, 401, "Invalid  password"); // Use 401 for unauthorized
      return;
    }

    // access token
    const accessToken = generateAccessToken(user._id.toString());
    // refresh token
    const refreshToken = generateRefreshToken(user._id.toString());

    // saving refresh token with current user
    user.refreshToken = refreshToken;
    // Set user to online after successful login
    user.isOnline = true;
    await user.save(); // Save the updated user status

    // Return user object excluding the password
    const {
      password: _,
      refreshToken: __,
      createdAt: ___,
      updatedAt: ____,
      ...userWithoutPassword
    } = user.toObject();

    // send refresh token in cookies
    res.cookie(REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: fiveDaysInMs,
    });
    res
      .status(200)
      .json({ ...userWithoutPassword, accessToken, success: true });
  } catch (error) {
    catchErrorResponse(res, error);
    return;
  }
};

//Logout controller
export const logout = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const cookies = req.cookies;
    const refreshToken = cookies[REFRESH_TOKEN_NAME];

    if (!refreshToken || !userId) {
      clearRefreshToken(res);
      sendErrorResponse(
        res,
        204,
        "No refresh token found, user already logged out"
      );
      return;
    }

    const user = await User.findById(userId).select(["-password", "-friends"]);

    // check if user was found
    if (!user || user.refreshToken !== refreshToken) {
      clearRefreshToken(res);
      sendErrorResponse(res, 403, "Invalid refresh token");
      return;
    }

    user.refreshToken = "";
    user.isOnline = false;
    await user.save();

    // //clear the cookie storing refresh token
    clearRefreshToken(res);

    const {
      password: _,
      refreshToken: __,
      createdAt: ___,
      updatedAt: ____,
      ...userWithoutPassword
    } = user.toObject();

    // res.cookie(REFRESH_TOKEN_NAME, refreshToken, { httpOnly: true });
    res.status(201).json({ success: true, user: userWithoutPassword });
    return;
  } catch (error) {
    catchErrorResponse(res, error);
    return;
  }
};

export const createNewUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if username, email, and password are provided
    if (!username || !email || !password) {
      console.log("Provide username, email, and password");
      sendErrorResponse(res, 400, "Provide username, email, and password");
      return;
    }

    // Validate email format (basic regex for demonstration)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      sendErrorResponse(res, 400, "Invalid email format");
      return;
    }

    // Check if user with the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      sendErrorResponse(res, 409, "User with this email already exists");
      return;
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    if (!user) {
      sendErrorResponse(res, 500, "Failed to create user");
    }

    // access token
    const accessToken = generateAccessToken(user._id.toString());
    // refresh token
    const refreshToken = generateRefreshToken(user._id.toString());

    // saving refresh token with current user
    user.refreshToken = refreshToken;
    await user.save();

    // send refresh token in cookies
    res.cookie(REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: fiveDaysInMs,
    });
    // Respond with the created user excluding the password
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profile_picture: user.profile_picture,
      accessToken,
    });
    return;
  } catch (error) {
    catchErrorResponse(res, error);
    return;
  }
};

// Refresh Token Controller
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_NAME];

    if (!refreshToken) {
      res.sendStatus(401); // unauthorized
      return;
    }

    const foundUser = await User.findOne({ refreshToken: refreshToken });

    if (!foundUser) {
      console.log("user not found");
      res.sendStatus(403); //forbidden
      return;
    }

    jwt.verify(
      refreshToken,
      `${process.env.Refresh_TOKEN_SECRET}` as string,
      (err: any, decode: any) => {
        // match if error or user._id is not equal to decode.id of cookie
        if (
          err ||
          !new mongoose.Types.ObjectId(foundUser._id.toString()).equals(
            new mongoose.Types.ObjectId(decode.id as string)
          )
        ) {
          console.log("user id not match with decode user id");
          res.sendStatus(403); //forbidden
          return;
        }

        const accessToken = generateAccessToken(foundUser._id.toString());
        res.status(201).json({ accessToken });
        return;
      }
    );
  } catch (error) {
    catchErrorResponse(res, error);
    return;
  }
};
