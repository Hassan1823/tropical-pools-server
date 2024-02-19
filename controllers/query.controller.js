import { CatchAsyncError } from "../middleware/catchAsyncError.js";
import queryModel from "../models/query.model.js";
import userModel from "../models/user.model.js";
import ErrorHandler from "../utils/errorHandler.js";
import sendMail from "../utils/sendMail.js";

export const sendQuery = CatchAsyncError(async (req, res, next) => {
  try {
    const { name, phone, email, message } = req.body;

    const userId = req.user;

    if (!userId) {
      return next(new ErrorHandler("Please Login First", 400));
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return next(new ErrorHandler("No User Found", 404));
    }

    const data = { name: user.name, phone, email: user.email, message };
    try {
      const createQuery = await queryModel.create({
        name,
        phone,
        email,
        message,
        userId: user._id,
      });

      //   ~ saving the id of the post for the user
      user.queries.push(createQuery._id);

      await user.save();

      await sendMail({
        email: process.env.SMTP_MAIL,
        subject: "New Query",
        template: "query-mail.ejs",
        data,
      });
      res.status(200).json({
        success: true,
        message: `Please Check Your ${process.env.SMTP_MAIL}`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
