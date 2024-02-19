import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/errorHandler.js";
import { CatchAsyncError } from "./catchAsyncError.js";
import userModel from "../models/user.model.js";

// ~ authenticated user
export const isAuthenticated = CatchAsyncError(async (req, res, next) => {
  const access_token = req.cookies.access_token;

  if (!access_token) {
    return next(new ErrorHandler("Please Login to Access", 400));
  }

  const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN);

  if (!decoded) {
    return next(new ErrorHandler("Access token is not valid", 400));
  }

  const user = await userModel.findById(decoded.id);

  if (!user) {
    return next(new ErrorHandler("No User Found", 404));
  }

  req.user = user;

  next();
});
