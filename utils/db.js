import mongoose from "mongoose";

import { config } from "dotenv";
config();

const dbURL = process.env.DB_URL || "";

const connectDB = async () => {
  try {
    await mongoose.connect(dbURL).then((data) => {
      console.log(`✅ DB is connected with ${data.connection.host}`);
    });
  } catch (error) {
    console.log(`❌ DB Error: ${error.message}`);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
