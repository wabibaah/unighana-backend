import mongoose from "mongoose";

export const dbConnect = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO);
    console.log("Database connected");
  } catch (err) {
    console.log(err);
  }
};

mongoose.set("strictQuery", true);
