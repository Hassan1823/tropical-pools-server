import express from "express";

import {
  activateUser,
  confirmOrder,
  confirmResetPassword,
  deleteCartItem,
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
import { sendQuery } from "../controllers/query.controller.js";
import {
  addToCart,
  createProduct,
  deleteProduct,
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

userRouter.post("/delete-cart-product", isAuthenticated, deleteCartItem);

userRouter.post("/confirm-order", isAuthenticated, confirmOrder);

// ! queries routes
userRouter.post("/send-query", isAuthenticated, sendQuery);

// ! products routes

userRouter.post("/create-product", isAuthenticated, createProduct);

userRouter.post("/add-to-cart", isAuthenticated, addToCart);

userRouter.post("/delete-product", isAuthenticated, deleteProduct);

userRouter.post("/all-products", getAllProducts);

userRouter.post("/product-by-id", getAllProductsById);

userRouter.post("/product-by-name", productsByNames);

// ! review routes
userRouter.post("/create-review", isAuthenticated, productReview);

userRouter.get("/all-reviews", getAllProductsReview);

export default userRouter;
