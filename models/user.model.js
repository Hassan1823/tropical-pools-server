import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { config } from "dotenv";
config();
import jwt from "jsonwebtoken";

// ~ to validate the email pattern
const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ~ user Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Your Name"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Please Enter Your Email"],
      validate: {
        validator: function (value) {
          return emailRegexPattern.test(value);
        },
        message: "Please Enter The Valid Email",
      },
    },
    password: {
      type: String,
      select: false,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      default: "user",
    },
    queries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Query",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ! TODO:
// 1) Cart or Purchased Product
// 2) Reviews
// 3) user Query

// ! hashing password before saving the user details
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ! sign access token
userSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", {
    expiresIn: "5m",
  });
};

// ! sign refresh token
userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
    expiresIn: "3d",
  });
};

// ! compare password with the hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ~ export the schema
const userModel = mongoose.model("User", userSchema);
export default userModel;
