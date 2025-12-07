import { config } from "dotenv";
import mongoose from "mongoose";

config();

const connectDb = async (): Promise<void> => {
  try {
    const connect = await mongoose.connect(process.env.DATABASEURL as string);
    console.log(`MongoDB connected successfully ${connect.connection.name}`);
  } catch (error: any) {
    console.error(" MongoDB connection failed", error.message);
  }
};

export { connectDb };
