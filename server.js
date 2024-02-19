import { app } from "./app.js";
// import { config } from 'dotenv';
import { config } from "dotenv";
import connectDB from "./utils/db.js";
config();

// ! create the server
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server is running at PORT : ${process.env.PORT}`);

  // ~ connect the database
  connectDB();
});
