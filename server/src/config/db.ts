import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("MONGO_URI:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("MongoDB Connected");
    console.log("[DEBUG] Connected database:", mongoose.connection.db?.databaseName);
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log("[DEBUG] Collections:", collections?.map((c) => c.name));
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;