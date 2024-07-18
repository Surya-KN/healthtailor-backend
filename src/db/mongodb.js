import mongoose from "mongoose";
import { MONGO_DB_NAME } from "../constants.js";

const connectToMongo = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${MONGO_DB_NAME}`);
    console.log(`Connected to MongoDB: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    process.exit(1);
  }
};

export { connectToMongo, mongoose };
