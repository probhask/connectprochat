import { Router } from "express";

import verifyJWT from "../../middlewares/verifyJWT";
import { login, logout, refresh, register } from "./controllers/auth.controllers";
import {
  deleteAccount,
  explore,
  getFriends,
  getUser,
  removeFriend,
  removeProfilePicture,
  updateLastSeen,
  updatePassword,
  updatePersonalData,
} from "./controllers/profile.controllers";
import { getSideProfileData } from "./controllers/side-profile.controllers";

/** Mounted at /api/auth — no auth required (this IS the auth flow). */
export const authRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/refresh", refresh);
authRouter.post("/logout", verifyJWT, logout);

/** Mounted at /api/user — every route requires a verified access token. */
export const userRouter = Router();
userRouter.use(verifyJWT);

userRouter.get("/explore", explore);
userRouter.get("/friends", getFriends);
userRouter.get("/side-profile", getSideProfileData);
userRouter.patch("/last-seen", updateLastSeen);
userRouter.get("/:id", getUser);

userRouter.put("/update-profile-data", updatePersonalData);
userRouter.put("/update-password", updatePassword);

userRouter.delete("/unfriend", removeFriend);
userRouter.delete("/profile-pic", removeProfilePicture);
userRouter.delete("/", deleteAccount);
