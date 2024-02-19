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
  userData,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.js";
import { sendQuery } from "../controllers/query.controller.js";
// import { sendQuery } from "../controllers/query.controller.js";
const userRouter = express.Router();

//! user routes

userRouter.post("/registration", registerUser);

userRouter.post("/activate-user", activateUser);

userRouter.post("/login-user", loginUser);

userRouter.get("/logout-user", isAuthenticated, logoutUser);

userRouter.post("/reset-password", resetPassword);

userRouter.post("/confirm-password", confirmResetPassword);

userRouter.get("/refresh-token", updateAccessToken);

userRouter.get("/me", isAuthenticated, getUserInfo);

userRouter.post("/social-auth", socialAuth);

userRouter.get("/user-queries", isAuthenticated, userData);

// ! queries routes
userRouter.post("/send-query", isAuthenticated, sendQuery);

export default userRouter;
