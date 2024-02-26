import ErrorHandler from "../utils/errorHandler.js";

export const ErrorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  //   ~ for wrong mongodb id
  if (err.name === "CastError") {
    const message = `Resource not found or Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  //   ~ duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  //   ~ wrong JWT token
  if (err.name === "JsonWebTokenError") {
    const message = `Invalid JWT Token , Please try again `;
    err = new ErrorHandler(message, 400);
  }

  //   ~ JWT token expired error
  if (err.name === "TokenExpiredError") {
    const message = `Please Reload The Page `;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
