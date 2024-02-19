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

// ! refresh token on refresh
// export const updateAccessToken = CatchAsyncError(async (req, res, next) => {
//   try {
//     const refresh_token = req.cookies.refresh_token;

//     const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN);
//     const message = `🥲 Couldn't Refresh Token`;

//     if (!decoded) {
//       return next(new ErrorHandler(message, 400));
//     }

//     const user = await userModel.findById(decoded.id);
//     if (!user) {
//       return next(new ErrorHandler(message, 400));
//     }

//     const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN, {
//       expiresIn: "30m",
//     });

//     const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN, {
//       expiresIn: "3d",
//     });

//     req.user = user;

//     res.cookie("access_token", accessToken, accessTokenOptions);
//     res.cookie("refresh_token", refreshToken, refreshTokenOptions);

//     res.status(200).json({
//       status: "success",
//       accessToken,
//     });

//     // console.log(decoded._id);
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 400));
//   }
// });

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
      expiresIn: "5m",
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
