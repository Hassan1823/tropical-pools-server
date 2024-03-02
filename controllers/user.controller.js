import jwt from "jsonwebtoken";
import { CatchAsyncError } from "../middleware/catchAsyncError.js";
import userModel from "../models/user.model.js";
import ErrorHandler from "../utils/errorHandler.js";

import { config } from "dotenv";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt.js";
import sendMail from "../utils/sendMail.js";
config();

import bcrypt from "bcryptjs";

// ! register user
export const registerUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ~ is email already exist
    const isEmailExist = await userModel.findOne({ email });

    if (isEmailExist) {
      return next(new ErrorHandler("Email Already Exist"));
    }

    const user = {
      name,
      email,
      password,
    };

    const activationToken = createActivationToken(user);

    const activationCode = activationToken.activationCode;

    const data = { user: { name: user.name }, activationCode };

    //     ~ send the verification to the user email

    try {
      await sendMail({
        email: user.email,
        subject: "Activate Your Account",
        template: "activation-mail.ejs",
        data,
      });

      res.status(201).json({
        success: true,
        message: `Please check your ${user.email}`,
        activationToken: activationToken.token,
      });
    } catch (error) {
      return next(new ErrorHandler(`Email Send Error : ${error.message}`, 400));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ~ create activation token
export const createActivationToken = (user) => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET,
    {
      expiresIn: "30m",
    }
  );

  return { token, activationCode };
};

// ! -------------------------

// ! activate the user

export const activateUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { activation_token, activation_code } = req.body;

    const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);

    if (newUser.activationCode !== activation_code) {
      return next(new ErrorHandler("Invalid activation code", 400));
    }

    const { name, email, password } = newUser.user;

    const existUser = await userModel.findOne({ email });

    if (existUser) {
      return next(new ErrorHandler("Email is already registered", 400));
    }

    const user = await userModel.create({ name, email, password });

    res.status(201).json({
      success: true,
      message: `✅ User Created Successfully`,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ! -------------------------------

// ! user login

export const loginUser = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("Please Fill All The Fields", 400));
    }

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("Invalid Credentials", 400));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Wrong Password", 400));
    }

    // console.log(`All good till here`);

    // .....

    sendToken(user, 200, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ! ---------------------------

// ! user logout
export const logoutUser = CatchAsyncError(async (req, res, next) => {
  try {
    res.cookie("access_token", "", { maxAge: 1 });
    res.cookie("refresh_token", "", { maxAge: 1 });

    res.status(200).json({
      success: true,
      message: `✅ Successfully Logged out`,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ! -------------------------------
// ! reset password
export const resetPassword = CatchAsyncError(async (req, res, next) => {
  try {
    const { email } = req.body;

    // ~ check if user exist or not
    const user = await userModel.findOne({ email });

    if (!user) {
      return next(new ErrorHandler("No User Found"));
    }

    const activationToken = createActivationToken(user);

    const activationCode = activationToken.activationCode;

    const data = { user: { name: user.name }, activationCode };
    //     ~ send the verification to the user email

    try {
      await sendMail({
        email: user.email,
        subject: "Reset Your Password",
        template: "activation-mail.ejs",
        data,
      });

      res.status(201).json({
        success: true,
        message: `Please check your ${user.email}`,
        activationToken: activationToken.token,
      });
    } catch (error) {
      return next(new ErrorHandler(`Email Send Error : ${error.message}`, 400));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ! -------------------------

// ! activate the user

export const confirmResetPassword = CatchAsyncError(async (req, res, next) => {
  try {
    const { activation_token, activation_code, newPassword } = req.body;

    const decodedToken = jwt.verify(
      activation_token,
      process.env.ACTIVATION_SECRET
    );

    if (decodedToken.activationCode !== activation_code) {
      return next(new ErrorHandler("Invalid activation code", 400));
    }

    const { name, email, password } = decodedToken.user;

    const existUser = await userModel.findOne({ email });

    if (!existUser) {
      return next(new ErrorHandler("No User Found", 400));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userModel.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    res.status(201).json({
      success: true,
      message: `✅ Password Updated successfully`,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ! update access tokens
export const updateAccessToken = CatchAsyncError(async (req, res, next) => {
  try {
    const refresh_token = req.cookies.refresh_token;
    // console.log(`😌 Refresh Token : ${refresh_token}`);

    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN);

    const message = `🥲 Couldn't Refresh Token`;

    if (!decoded) {
      return next(new ErrorHandler(message, 400));
    }

    const user = await userModel.findById(decoded.id);
    if (!user) {
      return next(new ErrorHandler(message, 400));
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
      expiresIn: "30m",
    });

    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN, {
      expiresIn: "3d",
    });

    req.user = user;

    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(200).json({
      status: "success",
      accessToken,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// !-------------------
//! get user info
export const getUserInfo = CatchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const user = await userModel.findById(userId);
    if (user) {
      res.status(201).json({
        success: true,
        user,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No User Found",
      });
    }
    // getUserById(userId, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// !-----------------------
// ! social auth like google
export const socialAuth = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, name, avatar } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      const newUser = await userModel.create({ email, name, avatar });
      sendToken(newUser, 200, res);
      // return next(new ErrorHandler(`🥲 No User Found`, 400))
    } else {
      sendToken(user, 200, res);
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// !-------------------
// ! get user queries

export const userData = CatchAsyncError(async (req, res, next) => {
  try {
    const userID = req.user._id;

    if (!userID) {
      return next(new ErrorHandler("Please Login", 400));
    }

    const user = await userModel
      .findById(userID)
      .select("queries")
      .populate("queries");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// !------------------
// ! user cart products

export const userCart = CatchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return next(new ErrorHandler("Please Login To View Cart"));
    }

    let cart = await userModel
      .findById(user._id)
      .select("products.product products.quantity products.status products._id")
      .populate("products.product");

    if (cart.length === 0 || !cart) {
      return next(new ErrorHandler("No Cart Found", 404));
    }

    // Access the 'products' array within the 'cart' object and filter based on 'status'
    const filteredProducts = cart.products.filter(
      (product) => product.status === "pending"
    );

    res.status(200).json({
      success: true,
      cart: {
        _id: cart._id,
        products: filteredProducts,
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// !---------------------------
//! active orders

export const getActiveOrders = CatchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return next(new ErrorHandler("Please Login To View Cart"));
    }

    let cart = await userModel
      .findById(user._id)
      .select("products.product products.quantity products.status products._id")
      .populate("products.product");

    if (cart.length === 0 || !cart) {
      return next(new ErrorHandler("No Cart Found", 404));
    }

    // Access the 'products' array within the 'cart' object and filter based on 'status'
    const filteredProducts = cart.products.filter(
      (product) => product.status !== "pending"
    );

    res.status(200).json({
      success: true,
      cart: {
        _id: cart._id,
        products: filteredProducts,
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// !-------------
// ! delete item from the cart
export const deleteCartItem = CatchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return next(new ErrorHandler("Please Login To View Cart"));
    }

    const { productId } = req.body;

    let matchedProductIndex;

    // Loop through the user's products array to find the index of the product to delete
    user.products.forEach((item, idx) => {
      if (item._id.toString() === productId) {
        matchedProductIndex = idx;
        return; // Break the loop once match is found
      }
    });

    // Check if the product was found in the user's cart
    if (matchedProductIndex === undefined) {
      return next(new ErrorHandler("Product not found in cart"));
    }

    // Remove the product from the user's cart using splice method
    user.products.splice(matchedProductIndex, 1);

    // Update the user's cart in the database
    await user.save();

    // Log the updated cart to console for debugging purposes
    // console.log(user.products);

    // Respond with a success message after deleting the product
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    // If any error occurs during execution, return an error message with status code 400
    return next(new ErrorHandler(error.message, 400));
  }
});

// !---------------------
// ! confirm user order
export const confirmOrder = CatchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return next(new ErrorHandler("Please Login To Confirm Order"));
    }

    const { status } = req.body;

    if (!status || !Array.isArray(user.products)) {
      return next(new ErrorHandler("Invalid Input"));
    }

    // Check if all products are in 'processing' state
    const allProcessing = user.products.every(
      (product) => product.status === "processing"
    );

    if (allProcessing) {
      return next(new ErrorHandler("All Products Are Processing"));
    }

    let changedProductCount = 0;

    user.products.forEach((product) => {
      if (product.status !== "processing") {
        product.status = status;
        changedProductCount++;
      }
    });

    if (changedProductCount > 0) {
      await user.save();

      res.status(200).json({
        success: true,
        message: `${changedProductCount} Product${
          changedProductCount > 1 ? "s" : ""
        } Updated`,
        status: user.products,
      });
    } else {
      res.status(200).json({
        success: false,
        message: "No Changes Made",
        status: user.products,
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// !----------------
// ! get all users
export const allUsers = CatchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return next(
        new ErrorHandler("You are not authorized to perform this action", 400)
      );
    }

    const users = await userModel.find().select("name email role _id");

    if (users.length === 0) {
      return next(new ErrorHandler("No Users Found", 404));
    }

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// ! ----------
// ! change user role
export const changeUserRole = CatchAsyncError(async (req, res, next) => {
  try {
    const user = req.user;
    if (user.role !== "admin") {
      return next(
        new ErrorHandler("You are not authorized to perform this action", 400)
      );
    }

    const { userId, role } = req.body;
    const userRole = await userModel.findByIdAndUpdate(userId, { role });

    if (!userRole) {
      return next(new ErrorHandler("No User Found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Role Updated",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
