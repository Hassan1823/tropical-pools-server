import mongoose from "mongoose";
import { config } from "dotenv";
config();

// ~ to validate the email pattern
const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const querySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Your Name"],
    },
    phone: {
      type: String,
      required: [true, "Please Enter Your Phone Number"],
      min: 10,
      max: 14,
    },
    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      validate: {
        validator: function (value) {
          return emailRegexPattern.test(value);
        },
        message: "Please Enter The Valid Email",
      },
    },
    message: {
      type: String,
      required: [true, "Please Write Your Query"],
      min: 1,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const queryModel = mongoose.model("Query", querySchema);

export default queryModel;
