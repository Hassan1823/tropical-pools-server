import express from "express";

import {
  activateUser,
  confirmResetPassword,
  getUserInfo,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  socialAuth,
  updateAccessToken,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.js";
const userRouter = express.Router();

userRouter.post("/registration", registerUser);

userRouter.post("/activate-user", activateUser);

userRouter.post("/login-user", loginUser);

userRouter.get("/logout-user", isAuthenticated, logoutUser);

userRouter.post("/reset-password", resetPassword);

userRouter.post("/confirm-password", confirmResetPassword);

userRouter.get("/refresh-token", updateAccessToken);

userRouter.get("/me", isAuthenticated, getUserInfo);

userRouter.post("/social-auth", socialAuth);

export default userRouter;
