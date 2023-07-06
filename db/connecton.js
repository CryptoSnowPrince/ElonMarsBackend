import mongoose from "mongoose";

export const connectMongoDB = async () => {
  try {
    const connectDB = await mongoose.connect(process.env.DBCONNECTION);
    console.log(`Database connected: ${connectDB.connection.host}`.cyan.underline);
  } 
  catch (error) {
      console.log(error);
      process.exit(1);
  }
}

