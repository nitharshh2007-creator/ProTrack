// Migration script to add default settings to existing users
// Run this script after deploying the new user model

import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const addDefaultSettings = async () => {
  try {
    console.log("Connecting to MongoDB...");
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/ProTrack";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
    
    console.log("Updating users with default settings...");
    const result = await User.updateMany(
      {
        $or: [
          { theme: { $exists: false } },
          { density: { $exists: false } },
          { notifications: { $exists: false } }
        ]
      },
      {
        $set: {
          theme: "light",
          density: "comfortable",
          "notifications.email": true,
          "notifications.projectUpdates": true,
          "notifications.taskReminders": true,
          "notifications.teamInvites": true
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users with default settings`);
    console.log(`📊 Checked ${result.matchedCount} users total`);
    
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addDefaultSettings();
}

export { addDefaultSettings };