import express from "express";
export const app = express();

// ~ packages imports
import cors from "cors";
import cookieParser from "cookie-parser";

import { ErrorMiddleware } from "./middleware/error.js";
import userRouter from "./routes/user.routes.js";

// ~ body parser
// ! body parser
app.use(express.json({ limit: "50mb" }));

// ! cookies parser
app.use(cookieParser());

// ! cors
app.use(
  cors({
    // origin: process.env.ORIGIN,
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

// ~routes
app.use("/api", userRouter);

// ~ setting the server is running
app.get("/", (req, res) => {
  res.send("<h1>🚀 Server is Running ...</h1>");
});

// ~ testing route
app.get("/test", (req, res, next) => {
  res.status(200).json({
    success: true,
    message: `🚀 API is working`,
  });
});

// ! for the invalid routes
app.all("*", (req, res, next) => {
  const err = new Error(`❌ Invalid ${req.originalUrl} API Route`);
  err.statusCode = 404;
  next(err);
});

// ! error handler /middleware
app.use(ErrorMiddleware);
