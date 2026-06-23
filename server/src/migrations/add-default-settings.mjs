// Simple Node.js migration script - no TypeScript compilation needed
// Run with: node src/migrations/add-default-settings.mjs

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Simple User schema for migration purposes
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  theme: String,
  density: String,
  notifications: {
    email: Boolean,
    projectUpdates: Boolean,
    taskReminders: Boolean,
    teamInvites: Boolean
  },
  workspaceId: mongoose.Schema.Types.ObjectId,
  passwordChangedAt: Date,
  resetToken: String,
  resetTokenExpiry: Date
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

const addDefaultSettings = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/ProTrack";
    console.log("Using MongoDB URI:", mongoUri.replace(/\/\/.*@/, "//***:***@")); // Hide credentials in log
    
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");
    
    console.log("🔄 Updating users with default settings...");
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
    console.log("🔌 Disconnected from MongoDB");
    console.log("✨ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

// Execute the migration
addDefaultSettings();