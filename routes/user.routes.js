import express from "express";

import {
  activateUser,
  allUsers,
  changeUserRole,
  confirmOrder,
  confirmResetPassword,
  deleteCartItem,
  getActiveOrders,
  getUserInfo,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  socialAuth,
  updateAccessToken,
  userCart,
  userData,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.js";
import {
  getAllQueries,
  sendQuery,
  sendQueryReply,
} from "../controllers/query.controller.js";
import {
  addToCart,
  changeStatus,
  createProduct,
  deleteProduct,
  getAllOrders,
  getAllProducts,
  getAllProductsById,
  getAllProductsReview,
  productReview,
  productsByNames,
} from "../controllers/product.controller.js";
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

userRouter.get("/user-cart", isAuthenticated, userCart);

userRouter.get("/user-active-orders", isAuthenticated, getActiveOrders);

userRouter.post("/delete-cart-product", isAuthenticated, deleteCartItem);

userRouter.post("/confirm-order", isAuthenticated, confirmOrder);

userRouter.get("/all-users", isAuthenticated, allUsers);

userRouter.post("/user-role", isAuthenticated, changeUserRole);

// ! queries routes
userRouter.post("/send-query", isAuthenticated, sendQuery);

userRouter.get("/all-queries", isAuthenticated, getAllQueries);

userRouter.post("/query-reply", isAuthenticated, sendQueryReply);

// ! products routes

userRouter.post("/create-product", isAuthenticated, createProduct);

userRouter.post("/add-to-cart", isAuthenticated, addToCart);

userRouter.post("/delete-product", isAuthenticated, deleteProduct);

userRouter.post("/all-products", getAllProducts);

userRouter.post("/product-by-id", getAllProductsById);

userRouter.post("/product-by-name", productsByNames);

userRouter.post("/change-status", isAuthenticated, changeStatus);

// ! review routes
userRouter.post("/create-review", isAuthenticated, productReview);

userRouter.get("/all-reviews", getAllProductsReview);

// ! orders

userRouter.get("/all-orders", getAllOrders);

export default userRouter;
